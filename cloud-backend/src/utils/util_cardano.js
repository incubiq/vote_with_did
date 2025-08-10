
/*
 *       Calls to Cardano Lib APIs
 */

const axios = require('axios').default;
const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs");
const Bip39 = require("bip39");
const {Buffer} = require('buffer');
const { Seed } = require('cardano-wallet-js');
  
let harden = function (num) {
    return 0x80000000 + num;
}

/*
 *       Wallet
 */

// check here: https://forum.cardano.org/t/using-emurgo-cardano-serialization-lib-nodejs-for-creating-and-signing-transaction/88864 

const getKeyDetailsFromSeed = (_seed) => {
     
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(_seed, Buffer.alloc(0));
    const privateKey = rootKey.to_raw_key();
    const publicKey = rootKey.to_public().to_raw_key();
    
    const accountKey = rootKey
        .derive(harden(1852)) // purpose
        .derive(harden(1815)) // coin type
        .derive(harden(0)); // account #0
    
        const utxoKey = accountKey
        .derive(0) // external
        .derive(0);
        
    const stakeKey = accountKey
        .derive(2) // chimeric
        .derive(0)

    return { 
        seed: _seed,
        privateKey: privateKey, 
        publicKey: publicKey, 
        utxoPubKey: utxoKey.to_public(), 
        utxoPrivKey: utxoKey.to_raw_key(), 
        stakePublicKey: stakeKey.to_public(),
        stakePrivateKey: stakeKey.to_raw_key() 
    }
}

const getKeyDetails = (_mnemonic) => {
    const entropy = Bip39.mnemonicToEntropy(_mnemonic);
    const _seed = Buffer.from(entropy, 'hex');    
    let objKey = getKeyDetailsFromSeed(_seed);
    return objKey;
}

const getBaseAddress = (objKey) => {
    const baseAddr = CardanoWasm.BaseAddress.new(
        gConfig.serviceWallet.networkId,
        CardanoWasm.StakeCredential.from_keyhash(objKey.utxoPubKey.to_raw_key().hash()),
        CardanoWasm.StakeCredential.from_keyhash(objKey.stakePublicKey.to_raw_key().hash()),
      );
    return baseAddr;
}


const getPrivateKey = (objKey) => {
    return objKey.privateKey;
}

const getPublicKey = (objKey) => {
    return objKey.publicKey;
}

const getPrivateStakeKey = (objKey) => {
    return objKey.stakePrivateKey;
}

const getPublicStakeKey = (objKey) => {
    return objKey.stakePublicKey;
}

const getStakeAddress = (objKey) => {
    const stakeAddr = CardanoWasm.RewardAddress.new(
        gConfig.serviceWallet.networkId,
        CardanoWasm.StakeCredential.from_keyhash(objKey.stakePublicKey.to_raw_key().hash())
    );
    return stakeAddr;
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
const derivePrivKeyFromSeed = (mnemonic, accountIndex = 0) => {
    try {
        // Convert mnemonic to seed
        const entropy = Bip39.mnemonicToSeedSync(mnemonic);
        const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
            Buffer.from(entropy, 'hex'),
            Buffer.from('') // Empty passphrase
        );
        // Standard Cardano derivation path for the account
        // m/1852'/1815'/account'
        const accountKey = rootKey
            .derive(harden(1852))  // purpose (Shelley)
            .derive(harden(1815))  // coin type (Cardano)
            .derive(harden(accountIndex)); // account index


        // --- Derive the Payment Key (for spending) ---
        // Path: .../0/0
        const paymentKey = accountKey.derive(0).derive(0).to_raw_key();
        const paymentPubKey = paymentKey.to_public();
        const paymentCred = CardanoWasm.StakeCredential.from_keyhash(paymentPubKey.hash());

        // --- Derive the Staking Key (for rewards/staking) ---
        // Path: .../2/0
        const stakeKey = accountKey.derive(2).derive(0).to_raw_key();
        const stakePubKey = stakeKey.to_public();
        const stakeCred = CardanoWasm.StakeCredential.from_keyhash(stakePubKey.hash());

        const stakingAddress = null;

//        CardanoWasm.BaseAddress.new(
//            networkId,  // Network ID for Preview
//            stakeCred
//        );
        
        // --- Create the Base Address (Payment + Staking) ---
        // const networkId = CardanoWasm.NetworkInfo.preview().network_id(); // Preview Testnet
        const baseAddress = CardanoWasm.BaseAddress.new(
            gConfig.serviceWallet.networkId,
            paymentCred,
            stakeCred
        );
        
        return {
            privateKey: paymentKey.to_bech32(),
            address: baseAddress.to_address().to_bech32(),
//            stakingAddress: stakingAddress.to_address().to_bech32(),
            hex: Buffer.from(paymentKey.as_bytes()).toString('hex')
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
        let baseStake = getStakeAddress(objKey).to_address().to_bech32()

        const enterpriseAddr = CardanoWasm.EnterpriseAddress.new(
            gConfig.serviceWallet.networkId,
            CardanoWasm.StakeCredential.from_keyhash(objKey.utxoPubKey.to_raw_key().hash())
        ).to_address().to_bech32();

        return {
            data: {
                addr: baseAddr,
                stake_addr: baseStake,
                enterprise_addr: enterpriseAddr,
                private: getPrivateKey(objKey).to_bech32(),                
                stakePublic: getPublicStakeKey(objKey).to_bech32(),
                stakePrivate: getPrivateStakeKey(objKey).to_bech32(),
                utxoPrivKey: objKey.utxoPrivKey.to_bech32(),
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


/*
 *       DEBUG
 */

const  decodeAddress = (address) => {
    try {
        const addr = CardanoWasm.Address.from_bech32(address);
        const baseAddr = CardanoWasm.BaseAddress.from_address(addr);
        
        if (baseAddr) {
            const paymentKeyHash = Buffer.from(baseAddr.payment_cred().to_keyhash().to_bytes()).toString('hex');
            const stakeKeyHash = Buffer.from(baseAddr.stake_cred().to_keyhash().to_bytes()).toString('hex');
            
            console.log('Eternl payment key hash:', paymentKeyHash);
            console.log('Eternl stake key hash:', stakeKeyHash);
            console.log('Required key hash from error:', '82788db9c1cd1ed5cefb0e491414d5eddbb1fea251facd2b4381b10d');
            
            return { paymentKeyHash, stakeKeyHash };
        }
    } catch (error) {
        console.error('Failed to decode address:', error);
    }
}


function testEternlDerivations(mnemonic) {
    const testVariations = [
        // Variation 1: Standard CIP-1852 (what we have)
        () => {
            const seed = Bip39.mnemonicToSeedSync(mnemonic, "");
            return getKeyDetailsFromSeed(seed);
        },
        
        // Variation 2: No passphrase parameter
        () => {
            const seed = Bip39.mnemonicToSeedSync(mnemonic);
            return getKeyDetailsFromSeed(seed);
        },
        
        // Variation 3: Different entropy method
        () => {
            const entropy = Bip39.mnemonicToEntropy(mnemonic);
            const seed = Buffer.from(entropy, 'hex');
            return getKeyDetailsFromSeed(seed);
        },
        
        // Variation 4: Account index 1 instead of 0
        () => {
            const seed = Bip39.mnemonicToSeedSync(mnemonic, "");
            return getKeyDetailsFromSeedAccount1(seed);
        }
    ];
    
    const targetPaymentHash = '5934583f11c1e692ba21bd916e5eecccb5260aea832bfa0fb0f24fe8';
    const targetStakeHash = '3adacc2e8153b62acade8ba4578f8507373a02a313ca1261c9e2faa6';
    
    testVariations.forEach((variation, index) => {
        try {
            const keys = variation();
            const paymentHash = Buffer.from(keys.utxoPubKey.to_raw_key().hash().to_bytes()).toString('hex');
            const stakeHash = Buffer.from(keys.stakePublicKey.to_raw_key().hash().to_bytes()).toString('hex');
            
            console.log(`Variation ${index + 1}:`);
            console.log('Payment hash:', paymentHash);
            console.log('Stake hash:', stakeHash);
            console.log('Payment match:', paymentHash === targetPaymentHash);
            console.log('Stake match:', stakeHash === targetStakeHash);
            console.log('---');
            
            if (paymentHash === targetPaymentHash && stakeHash === targetStakeHash) {

                const paymentHash = Buffer.from(keys.utxoPubKey.to_raw_key().hash().to_bytes()).toString('hex');
                console.log('Does variation 3 match required hash?', paymentHash === targetPaymentHash);

                console.log(`🎯 FOUND MATCH! Use variation ${index + 1}`);
                console.log("PRIV : "+keys.privateKey.to_bech32());
                console.log("PUB : "+getBaseAddress(keys).to_address().to_bech32());
                console.log("STAKE : "+keys.stakePrivateKey.to_bech32());
                return keys;
            }
        } catch (error) {
            console.log(`Variation ${index + 1} failed:`, error.message);
        }
    });
}

// Also need this helper for account 1:
function getKeyDetailsFromSeedAccount1(seed) {
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(seed, Buffer.alloc(0));
    const accountKey = rootKey
        .derive(harden(1852))
        .derive(harden(1815))
        .derive(harden(1)); // ← Account 1 instead of 0
    
    // Rest same as your existing function
    const utxoKey = accountKey.derive(0).derive(0);
    const stakeKey = accountKey.derive(2).derive(0);
    
    return {
        // ... same structure
    };
}

//decodeAddress('');
// testEternlDerivations("");

module.exports = {
    generateSeedPhrase,
    getWalletDetails,
    async_prepareTx,
    async_signTx,
    async_submitTx,
    derivePrivKeyFromSeed
}