
/*
 *       Misc utils
 */

    const async_getWalletAssetsFromAddress = async (address) => {
            
        try {
        // First get address details to extract the stake address
        const addressResponse = await fetch(`${gConfig.blockfrost.url}/addresses/${address}`, {
            headers: {
            'project_id': gConfig.blockfrost.key
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
        return async_getAllWalletAssets(stakeAddress);
        } catch (error) {
        console.error('Error getting wallet assets from address:', error);
        throw error;
        }
    }

    const async_getAllWalletAssets = async (stakeAddress) => {

        const hexToUtf8 = (hex) => {
        const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
        const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return new TextDecoder('utf-8').decode(bytes);
        }

        try {
        // Step 1: Get all addresses associated with this stake address
        const addressesResponse = await fetch(`${gConfig.blockfrost.url}/accounts/${stakeAddress}/addresses`, {
            headers: {
            'project_id': gConfig.blockfrost.key
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
                const addressResponse = await fetch(`${gConfig.blockfrost.url}/addresses/${address}`, {
                headers: {
                    'project_id': gConfig.blockfrost.key
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
                const assetResponse = await fetch(`${gConfig.blockfrost.url}/assets/${unit}`, {
                headers: {
                    'project_id': gConfig.blockfrost.key
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

module.exports = {

    async_getWalletAssetsFromAddress,
    async_getAllWalletAssets
}