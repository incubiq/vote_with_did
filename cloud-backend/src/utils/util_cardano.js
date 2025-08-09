
/*
 *       Calls to Cardano Lib APIs
 */

const axios = require('axios').default;
const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs");
const Bip39 = require("bip39");
const {Buffer} = require('buffer');
const { Seed } = require('cardano-wallet-js');

const {
    Bip32PrivateKey,
    EnterpriseAddress,
    StakeCredential,
} = require('@emurgo/cardano-serialization-lib-nodejs');
    
let harden = function (num) {
    return 0x80000000 + num;
}

/*
 *       Wallet
 */

// check here: https://forum.cardano.org/t/using-emurgo-cardano-serialization-lib-nodejs-for-creating-and-signing-transaction/88864 

const getKeyDetailsFromSeed = (_seed) => {
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(_seed, Buffer.from (""));
    const privateKey = rootKey.to_raw_key();
    const publicKey = rootKey.to_public().to_raw_key();
    const accountKey = rootKey
        .derive(harden(1852)) // purpose
        .derive(harden(1815)) // coin type
        .derive(harden(0)); // account #0
    const utxoPubKey = accountKey
        .derive(0) // external
        .derive(0)
        .to_public();
    const stakeKey = accountKey
        .derive(2) // chimeric
        .derive(0)
        .to_public();

    return { 
        seed: _seed,
        privateKey: privateKey, 
        publicKey: publicKey, 
        utxoPubKey: utxoPubKey, 
        stakeKey: stakeKey 
    }
}

const getKeyDetails = (_mnemonic) => {
    const seed = Bip39.mnemonicToSeedSync(_mnemonic, "");
    return getKeyDetailsFromSeed(seed);
}

const getBaseAddress = (objKey) => {
    const baseAddr = CardanoWasm.BaseAddress.new(
        CardanoWasm.NetworkInfo.testnet().network_id(),
        CardanoWasm.StakeCredential.from_keyhash(objKey.utxoPubKey.to_raw_key().hash()),
        CardanoWasm.StakeCredential.from_keyhash(objKey.stakeKey.to_raw_key().hash()),
      );
    return baseAddr;
}


const getPrivateKey = (objKey) => {
    return objKey.privateKey;
}

const getPublicKey = (objKey) => {
    return objKey.publicKey;
}

const generateSeedPhrase = async function (){
    // generate a recovery phrase of 15 words (default)
    const mnemonic = Seed.generateRecoveryPhrase();
    return {
        data: {
            mnemonic: mnemonic,
            seed: Bip39.mnemonicToSeedSync(mnemonic, "").toString('hex')
        }
    };    
}

// an alternative to get priv key from seed
const derivePrivKeyFromSeed = (_seed, accountIndex = 0) => {
    try {
        // Convert mnemonic to seed
        const seed = Bip39.mnemonicToSeedSync(mnemonic);
        
        // Create root key from seed
        const rootKey = Bip32PrivateKey.from_bip39_entropy(
            seed.slice(0, 32),
            seed.slice(32, 64)
        );

        // Cardano derivation path: m/1852'/1815'/account'/0/0
        const accountKey = rootKey
            .derive(harden(1852))  // purpose (Shelley)
            .derive(harden(1815))  // coin type (Cardano)
            .derive(harden(accountIndex)); // account

        const paymentKey = accountKey
            .derive(0)  // external chain
            .derive(0); // address index

        // Get the private key for signing
        const privateKey = paymentKey.to_raw_key();
        
        // Get the public key for address generation
        const publicKey = privateKey.to_public();
        
        // Create payment credential
        const paymentCred = StakeCredential.from_keyhash(publicKey.hash());
        
        // Use EnterpriseAddress (no staking) instead of BaseAddress
        const enterpriseAddr = EnterpriseAddress.new(
            0, // Preview testnet network ID
            paymentCred
        );
        
        return {
            privateKey: privateKey.to_bech32(),
            address: enterpriseAddr.to_address().to_bech32(),
            hex: Buffer.from(privateKey.as_bytes()).toString('hex')
        };
        
    } catch (error) {
        console.error('Key derivation failed:', error);
        throw error;
    }
}

const getWalletDetails = async function (objParam){
    try {
        if(!objParam.mnemonic && !objParam.seed) {
            throw {
                data:null,
                status: 400,
                statusText: "Mnemonic required"
            }
        }

        let objKey=null;
        if(objParam.mnemonic) {
            objKey = getKeyDetails(objParam.mnemonic);
        }
        else {
            objKey = getKeyDetailsFromSeed(objParam.seed);
        }
        let baseAddr = getBaseAddress(objKey).to_address().to_bech32();
        return {
            data: {
                addr: baseAddr,
                private: getPrivateKey(objKey).to_bech32(),
                mnemonic: objParam.mnemonic,
                seed: objKey.seed.toString('hex')
            }
        };    
    }
    catch(err)  {
        throw err;
    }    
}

/*
 *       Transactions
 */

const async_prepareTx = async function (objParam){
}

const async_signTx = async function (objParam){
}

const async_submitTx = async function (objParam){
}

module.exports = {
    generateSeedPhrase,
    getWalletDetails,
    async_prepareTx,
    async_signTx,
    async_submitTx
}