const {
    Metaplex,
    keypairIdentity,
    irysStorage,
    toMetaplexFile,
    toBigNumber,
    PublicKey,
  } = require("@metaplex-foundation/js");
  const {
    percentAmount,
    generateSigner,
    signerIdentity,
    createSignerFromKeypair,
  } = require("@metaplex-foundation/umi");
  const {
    TokenStandard,
    createAndMint,
    transferV1,
    updateV1,
    unverifyCreatorV1,
    fetchMetadataFromSeeds,
  } = require("@metaplex-foundation/mpl-token-metadata");
  const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
  const { mplCandyMachine } = require("@metaplex-foundation/mpl-candy-machine");
  
  // import secret from './guideSecret.json';
  const {
    Connection,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
  } = require("@solana/web3.js");
  const fs = require("fs");
  const web3 = require("@solana/web3.js");
  function loadWalletKey(keypairFile) {
    const loaded = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
    );
    return loaded;
  }
  
  async function main() {
    let MainNetwork = true; // true = mainnet, false = devnet
    const metadata = {
      name: "HotelChain",
      symbol: "Hotel",
      description: "The Shiva coin on solana network",
      amount: BigInt("1420000000000000"),
      // 10_000_000_000_000_000_000
      // 18_446_744_073_709_551_615// add decimal places too
      decimals: 6,
      sellerFeeBasisPoints: 0, // transfer fee in basis points
    };
    let connection;
    let umi;
    let irysAddress;
    let irysProviderUrl;
  
    if (MainNetwork) {
      connection = new Connection(clusterApiUrl("mainnet-beta"));
      umi = createUmi("https://api.mainnet-beta.solana.com");
      irysAddress = "https://node2.irys.xyz";
    } else {
      connection = new Connection(clusterApiUrl("devnet"));
      umi = createUmi("https://api.devnet.solana.com");
      irysAddress = "https://devnet.bundlr.network";
      irysProviderUrl = "https://api.devnet.solana.com";
    }
  
    console.log("Creating ...");
    //account address that deployed the contract
    const myKeypair = loadWalletKey(
      "testWallet.json" // replace with your keypair file
    );
    const userWallet = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync("testWallet.json").toString()))
    );
    const userWalletSigner = createSignerFromKeypair(umi, userWallet);
    const mint = generateSigner(umi);
    umi.use(signerIdentity(userWalletSigner));
    umi.use(mplCandyMachine());
    let imageUri;
    let ImUri;
     try {
       const metaplex = Metaplex.make(connection)
         .use(keypairIdentity(myKeypair))
         .use(
           irysStorage({
             address: irysAddress,
             providerUrl: irysProviderUrl,
             // timeout: 60000,
           })
         );
       // code to get img uri
       const buffer = fs.readFileSync("./asset/shiva.png");
       const file = toMetaplexFile(buffer, "image.png");
       imageUri = await metaplex.storage().upload(file);
       console.log("imageUri", imageUri);
       upload metadata adding uri
       let { uri } = await metaplex.nfts().uploadMetadata({
         name: metadata.name,
         description: metadata.description,
         image: imageUri,
         //image: "https://arweave.net/uFlHpfjnJ7e9Jg94CVHDTKdBR81m2-SyUoogSk-2YHY",
         symbol: metadata.symbol,
       });
       console.log("uri", uri);
       ImUri = uri;
     } catch (error) {
       console.log("error", error);
     }
    try {
       createAndMint(umi, { 
         mint,
         authority: umi.identity,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: ImUri,
        //uri: "https://arweave.net/5572w_pWsZ4RdjGtO8Vbb6vcvKuWeZEOda81BuciIPg",
        sellerFeeBasisPoints: percentAmount(metadata.sellerFeeBasisPoints),
        decimals: metadata.decimals,
        amount: metadata.amount,
        tokenOwner: myKeypair.publicKey,
        tokenStandard: TokenStandard.Fungible,
        creators: null,
      })
        .sendAndConfirm(umi)
        .then(() => {
          console.log("Successfully minted tokens (", mint.publicKey, ")");
        });
    } catch (error) {
      console.log("error", error);
    }
  }
  
  main();
  