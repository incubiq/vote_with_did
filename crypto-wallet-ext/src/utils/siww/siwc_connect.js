/*
 *      Sign-In With Cardano / wallet connect
 */

import {siww_connect} from "./siww_connect"

// import cbor from 'cbor'
import {
  Address,
  Value,
  /*
  BaseAddress,
  MultiAsset,
  Assets,
  ScriptHash,
  Costmdls,
  Language,
  CostModel,
  AssetName,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionOutput,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionOutputBuilder,
  LinearFee,
  BigNum,
  BigInt,
  TransactionHash,
  TransactionInputs,
  TransactionInput,
  TransactionWitnessSet,
  Transaction,
  PlutusData,
  PlutusScripts,
  PlutusScript,
  PlutusList,
  Redeemers,
  Redeemer,
  RedeemerTag,
  Ed25519KeyHashes,
  ConstrPlutusData,
  ExUnits,
  Int,
  NetworkInfo,
  EnterpriseAddress,
  TransactionOutputs,
  hash_transaction,
  hash_script_data,
  hash_plutus_data,
  ScriptDataHash, Ed25519KeyHash, NativeScript, StakeCredential
  */
} from "@emurgo/cardano-serialization-lib-asmjs";

const CONNECTOR_SYMBOL = "SIWC"

const CARDANO_NETWORK = "cardano"
const CARDANO_MAINNET = "Cardano Mainnet"

const DEPRECATED_WALLETS = ["ccvault"]          // ID of all wallets we are not going to accept

const BLOCKFROST_BASE = 'https://cardano-mainnet.blockfrost.io/api/v0';
const BLOCKFROST_APIKEY = 'mainnetvyi4hSgZqzX1x16y5u34uC1a0VnfaTN2';

export class siwc_connect  extends siww_connect {

//
//      helpers
//

    createDefaultWallet(_idWallet) {
        let objDefault=super.createDefaultWallet(_idWallet);    
        if(window && window.cardano) {
            objDefault.chain=CARDANO_NETWORK;
            objDefault.apiVersion=window.cardano[_idWallet].apiVersion;     // get API version of wallet
            objDefault.name=window.cardano[_idWallet].name;                 // get name of wallet
            objDefault.logo=window.cardano[_idWallet].icon;                 // get get wallet logo
        }

        return this.getSanitizedWallet(objDefault);
    }

    getConnectorSymbol() {return CONNECTOR_SYMBOL}

    // we ONLY list PROD chains here
    getChainIDs() {
        return {
            "1": {chain: CARDANO_MAINNET, symbol:"ADA"},
        }
    }

    getAcceptedChains() {
        return [{
            connector: this.getConnectorSymbol(),
            name: CARDANO_MAINNET,
            symbol: "ADA",
            id: 1,
            image : "symbol_cardano.png"        // sorry, hardcoded
        }];
    }

    getConnectorMetadata (){
        return {
            symbol: CONNECTOR_SYMBOL,         // symbol
            connector_name: CARDANO_NETWORK,  // name of this connector
            wallet_name: "Cardano wallets",   // target display name
            blockchain_name: CARDANO_MAINNET, // blockchain name
            window: "cardano",                // the window element to explore
        }
    }

//
//      Initialization
//

    async async_initialize(objParam) {
        await super.async_initialize(objParam);        
    }

    async async_onListAccessibleWallets() {
        try {
            let _aWallet=[];
            if(window && window.cardano) {
                for (const key in window.cardano) {

                    // process if not deprecated
                    if(!DEPRECATED_WALLETS.includes(key)) {
                        if(window.cardano[key].hasOwnProperty("apiVersion")) {
                            let objWallet = await this.async_getDefaultWalletInfo(key);
                            
                            // push info for connection
                            _aWallet.push(this.getSanitizedWallet(objWallet));
                        }
    
                    }
                }
            }
            return _aWallet;
        }
        catch(err) {
            throw err;
        }
    }
    
//
//      Connect with wallet
//

    async async_enableWallet(idWallet) {
        let _api=null;
        try {
            _api = await window.cardano[idWallet].enable();
        }
        catch(err) {
            console.log ("Wallet connection refused ")
        }
        return _api;
    }

    async async_isWalletEnabled(idWallet) {
        let _isEnabled=false;
        try {
            _isEnabled=await window.cardano[idWallet].isEnabled();
        } catch (err) {
            console.log ("Could not ask if wallet is enabled")
        }
        return _isEnabled;
    }

//
//      Misc access to wallet public info
//

    // Define a browser-compatible replacement for Buffer.from(hex, "hex")
    hexStringToUint8Array(hexString) {
        if (hexString.length % 2 !== 0) {
        throw new Error('Invalid hex string');
        }
        const arrayBuffer = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
        const byteValue = parseInt(hexString.substring(i, i + 2), 16);
        if (isNaN(byteValue)) {
            throw new Error('Invalid hex string');
        }
        arrayBuffer[i/2] = byteValue;
        }
        return arrayBuffer;
    }

    async _async_getFirstAddress(_api) {
        try {
            const aRaw = await _api.getUsedAddresses();
            if(aRaw && aRaw.length>0) {
                const _firstAddress = Address.from_bytes(this.hexStringToUint8Array(aRaw[0])).to_bech32();
                return _firstAddress    
            }
            else {
                throw new Error("Could not access first address of wallet");
            }
        } catch (err) {
            console.log (err.message)
        }
        return null;
    }

    async _async_getUnusedAddress(_api) {
        try {
            const aRaw = await _api.getUnusedAddresses();
            if(aRaw && aRaw.length>0) {
                const _firstAddress = Address.from_bytes(this.hexStringToUint8Array(aRaw[0], "hex")).to_bech32()
                return _firstAddress
            }
            else {
                throw new Error("Could not access any unused addresses of wallet");
            }
        } catch (err) {
            console.log (err.message)
        }
        return null;
    }

    async  _async_getWalletAssetsFromAddress(address) {
        
        try {
          // First get address details to extract the stake address
          const addressResponse = await fetch(`${BLOCKFROST_BASE}/addresses/${address}`, {
            headers: {
              'project_id': BLOCKFROST_APIKEY
            }
          });
          
          if (!addressResponse.ok) {
            const errorData = await addressResponse.json();
            throw new Error(`Address lookup failed: ${errorData.message || addressResponse.statusText}`);
          }
          
          const addressData = await addressResponse.json();
          const stakeAddress = addressData.stake_address;
          
          if (!stakeAddress) {
            throw new Error(`No stake address found for ${address}. This might be a Byron address or an unused address.`);
          }
          
          console.log(`Found stake address: ${stakeAddress}`);
          
          // Now get all wallet assets using the stake address
          return this._async_getAllWalletAssets(stakeAddress);
        } catch (error) {
          console.error('Error getting wallet assets from address:', error);
          throw error;
        }
    }

    async _async_getAllWalletAssets(stakeAddress) {

        const hexToUtf8 = (hex) => {
          if(hex=="") {return ""}
          const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
          const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          return new TextDecoder('utf-8').decode(bytes);
        }
  
        try {
          // Step 1: Get all addresses associated with this stake address
          const addressesResponse = await fetch(`${BLOCKFROST_BASE}/accounts/${stakeAddress}/addresses`, {
            headers: {
              'project_id': BLOCKFROST_APIKEY
            }
          });
          
          if (!addressesResponse.ok) {
            const errorData = await addressesResponse.json();
            throw new Error(`Stake address lookup failed: ${errorData.message || addressesResponse.statusText}`);
          }
          
          const addresses = await addressesResponse.json();
          console.log(`Found ${addresses.length} addresses for stake address ${stakeAddress}`);
          
          // Step 2: Get assets for each address
          const addressesWithAssets = await Promise.all(
            addresses.map(async addressObj => {
              const address = addressObj.address;
              try {
                const addressResponse = await fetch(`${BLOCKFROST_BASE}/addresses/${address}`, {
                  headers: {
                    'project_id': BLOCKFROST_APIKEY
                  }
                });
                
                if (!addressResponse.ok) {
                  console.warn(`Could not fetch data for address ${address}: ${addressResponse.statusText}`);
                  return {
                    address,
                    lovelace: '0',
                    assets: []
                  };
                }
                
                const addressData = await addressResponse.json();
                
                return {
                  address,
                  lovelace: addressData.amount.find(item => item.unit === 'lovelace')?.quantity || '0',
                  assets: addressData.amount.filter(item => item.unit !== 'lovelace')
                };
              } catch (error) {
                console.warn(`Error processing address ${address}:`, error);
                return {
                  address,
                  lovelace: '0',
                  assets: []
                };
              }
            })
          );
          
          // Step 3: Aggregate all assets across addresses
          let totalLovelace = BigInt(0);
          const assetsMap = new Map();
          
          addressesWithAssets.forEach(addrData => {
            // Add lovelace (ADA)
            totalLovelace += BigInt(addrData.lovelace);
            
            // Aggregate other assets
            addrData.assets.forEach(asset => {
              const currentAmount = assetsMap.get(asset.unit) || BigInt(0);
              assetsMap.set(asset.unit, currentAmount + BigInt(asset.quantity));
            });
          });
          
          // Step 4: Fetch metadata for assets
          const assetsWithMetadata = await Promise.all(
            Array.from(assetsMap.entries()).map(async ([unit, quantity]) => {
              // Parse the asset unit into policy ID and asset name
              const policyId = unit.slice(0, 56);
              const assetNameHex = unit.slice(56);
              
              // Try to get asset metadata if available
              try {
                const assetResponse = await fetch(`${BLOCKFROST_BASE}/assets/${unit}`, {
                  headers: {
                    'project_id': BLOCKFROST_APIKEY
                  }
                });
                
                if (assetResponse.ok) {
                  const assetData = await assetResponse.json();
                  return {
                    unit,
                    quantity: quantity.toString(),
                    policyId,
                    assetNameHex,
                    displayName: assetData.onchain_metadata?.name || 
                                 assetData.metadata?.name || 
                                 hexToUtf8(assetNameHex) || 
                                 unit,
                    metadata: assetData.metadata || null,
                    onchainMetadata: assetData.onchain_metadata || null,
                    fingerprint: assetData.fingerprint || null
                  };
                }
              } catch (error) {
                console.warn(`Could not fetch metadata for asset ${unit}`, error);
              }
              
              // Return basic info if metadata fetch fails
              return {
                unit,
                quantity: quantity.toString(),
                policyId,
                assetNameHex,
                displayName: hexToUtf8(assetNameHex) || unit
              };
            })
          );
          
          return {
            stakeAddress,
            addresses: addressesWithAssets.map(a => a.address),
            totalAddresses: addresses.length,
            lovelace: totalLovelace.toString(),
            adaAmount: (Number(totalLovelace) / 1_000_000).toFixed(6),
            assets: assetsWithMetadata,
            totalAssetTypes: assetsWithMetadata.length
          };
        } catch (error) {
          console.error('Error fetching wallet assets:', error);
          throw error;
        }
      }
      

    // Sign a message on Cardano chain
    async async_signMessageOnly(objSiwcMsg, type, unused){
        try {
            // get signing address
            const usedAddresses = await objSiwcMsg.api.getUsedAddresses();
            const usedAddress = usedAddresses[0];

            // cardano specials, we swap signing address 
            objSiwcMsg.address=usedAddress;

            // validate address and encode message
            let objRet=await super.async_signMessageOnly(objSiwcMsg, type, usedAddress);

            // sign via wallet
            try{
                let _signed = await objSiwcMsg.api.signData(usedAddress, objRet.buffer);            
                objRet.key=_signed.key;
                objRet.signature = _signed.signature;    
                return objRet;    
            }
            catch(err) {
                throw new Error(err.info);
            }
        }
        catch (err) {
            throw err;
        }
    }

}

export default siwc_connect;