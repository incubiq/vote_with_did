const { 
  Address, 
  BaseAddress, 
  LinearFee,
  TransactionBuilder, 
  TransactionBuilderConfigBuilder,
  TransactionOutput,
  Value,
  AuxiliaryData,
  GeneralTransactionMetadata,
  TransactionMetadatum,
  BigNum,
  Transaction,
  TransactionWitnessSet,
  PrivateKey,
  Vkeywitnesses,
  make_vkey_witness,
  hash_transaction,
  TransactionHash,
  TransactionInput,
  StakeCredential,
  Vkeywitness,
  Vkey,
  Ed25519Signature
} = require('@emurgo/cardano-serialization-lib-nodejs');

const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const util_cardano = require('../utils/util_cardano');



/**
 * Anonymous Voting Backend Service for NodeJS
 * Handles vote submission, tallying, and results publication to Cardano (testnet)
 * Puts onchain every X min  (here 5 min)
 */

const batchInterval = 5 * 60 * 1000;  // 5min
const VWD_LABELS = {
    VOTE: 900000,           // For vote batches
    RESULT: 900100,         // For results publication
    AUDIT: 900200,          // For audit data
    TEST: 900900            // For testing
};

class AnonymousVoting {
  constructor() {    

    // In-memory storage 
    this.uncommitedVotes = [];

    // on disk storage 
    /*
    this.votesFilePath = path.join(process.cwd(), 'data', 'pending_votes.json');
    this.ensureDataDirectory();
    this.loadFromDisk();

    this.startBatchTimer();
    */
  }

/**
 *  Scheduling
 */

    startBatchTimer() {
        // first call, flush all we have within next 5secs
        setTimeout(async () => {
            await this.commitAllPendingBatches();
        }, 5000);

        // looping ever X min
        setInterval(async () => {
            await this.commitAllPendingBatches();
        }, batchInterval);
    }

    async commitAllPendingBatches() {
        if (this.uncommitedVotes.length > 0) {
        
            console.log(`🔄 Committing ${this.uncommitedVotes.length} pending votes...`);

            // Group votes by ballot
            const votesByBallot = this.groupVotesByBallot(this.uncommitedVotes);
            
            for (const [did_ballot, votes] of votesByBallot) {
                votes.forEach(item=> {delete item.did_ballot})      // save space, do not add ballot did (it is already in the package)
                const metadata = {
                    code: VWD_LABELS.VOTE,
                    data: null
                };
                metadata.data[VWD_LABELS.VOTE] = { 
                    app: gConfig.appName,
                    did: did_ballot,
                    av: votes,
                    ts: new Date().toISOString()
                }
                
                await this.async_commitToCardano(metadata);               
            }
            
            this.uncommitedVotes = []; // Clear after commit
            await this.clearDiskVotes();               
            console.log('✅ All pending votes committed and cleared from disk');
        }
    }

    groupVotesByBallot(votes) {
        const grouped = new Map();
        votes.forEach(vote => {
            if (!grouped.has(vote.did_ballot)) {
                grouped.set(vote.did_ballot, []);
            }
            grouped.get(vote.did_ballot).push(vote);
        });
        return grouped;
    }

/**
 * Voting (temp save to /load from disk)
 */

    async ensureDataDirectory() {
        try {
            const dataDir = path.dirname(this.votesFilePath);
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            throw {
                data: null,
                status: 400,
                statusText: 'Failed to create data directory'
            };
        }
    }

    async saveToDisk() {
        try {
            if (this.uncommitedVotes.length === 0) {
                return; // No votes to save
            }

            const saveData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                votes: this.uncommitedVotes,
                totalCount: this.uncommitedVotes.length
            };

            await fs.writeFile(
                this.votesFilePath, 
                JSON.stringify(saveData, null, 2), 
                'utf8'
            );

            console.log(`💾 Saved ${this.uncommitedVotes.length} pending votes to disk`);

        } catch (error) {
            throw {
                data: null,
                status: 400,
                statusText: 'Failed to save pending votes to disk'
            };
        }
    }

    async loadFromDisk() {
        try {
            // Check if file exists
            await fs.access(this.votesFilePath);
            
            const fileContent = await fs.readFile(this.votesFilePath, 'utf8');
            const saveData = JSON.parse(fileContent);

            // Validate data structure
            if (!saveData.votes || !Array.isArray(saveData.votes)) {
                console.warn('⚠️ Invalid votes file structure, starting fresh');
                this.uncommitedVotes = [];
                return;
            }

            this.uncommitedVotes = saveData.votes;
            
            console.log(`📁 Loaded ${this.uncommitedVotes.length} pending votes from disk`);
            console.log(`📅 Last saved: ${saveData.timestamp}`);

            // If we have pending votes, schedule immediate commit
            if (this.uncommitedVotes.length > 0) {
                console.log('🚀 Scheduling immediate commit of loaded votes...');
                setTimeout(() => {
                    this.commitAllPendingBatches();
                }, 5000); // Commit after 5 seconds
            }

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📝 No existing votes file found, starting fresh');
                this.uncommitedVotes = [];
            } else {
                this.uncommitedVotes = [];
                throw {
                    data: null,
                    status: 400,
                    statusText: 'Failed to load votes from disk'
                };
            }
        }
    }

    async clearDiskVotes() {
        try {
            await fs.unlink(this.votesFilePath);
            console.log('🗑️ Cleared votes file after successful commit');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw {
                    data: null,
                    status: 400,
                    statusText: 'Failed to clear votes file'
                };
            }
        }
    }

    async forceSave() {
        console.log('💾 Force saving pending votes...');
        await this.saveToDisk();
    }

    
/**
 * Voting (commit to mem + to onchain)
 */

    getPendingVotesStatus() {
        return {
            pendingCount: this.uncommitedVotes.length,
            oldestVote: this.uncommitedVotes.length > 0 ? this.uncommitedVotes[0].timestamp : null,
            newestVote: this.uncommitedVotes.length > 0 ? this.uncommitedVotes[this.uncommitedVotes.length - 1].timestamp : null
        };
    }

    async commitVote(objVote) {
        this.uncommitedVotes.push(objVote);      
        console.log(`📝 Vote added to pending queue (${this.uncommitedVotes.length} total)`);
        
        // Save to disk immediately
        await this.saveToDisk();
    }

  async async_commitToCardano(metadata) {
    try {

        // Get UTXOs from service wallet
        const utxosResponse = await axios.get(
            gConfig.blockfrost.url_preview + `/addresses/${gConfig.serviceWallet.address}/utxos`,
            { headers: { 'project_id': gConfig.blockfrost.key_preview } }
        );

        const utxos = utxosResponse.data;
        if (utxos.length === 0) {
             throw {
                data: null,
                status: 400,
                statusText: "No UTXOs - service wallet empty"
            };
        }

        // --- 1. CONFIGURE THE TRANSACTION BUILDER ---
        // Get the latest network protocol parameters
        const protocolParamsResponse = await axios.get(
            gConfig.blockfrost.url_preview + '/epochs/latest/parameters',
            { headers: { 'project_id': gConfig.blockfrost.key_preview } }
        );
        const protocolParams = protocolParamsResponse.data;

        const txBuilderConfig = TransactionBuilderConfigBuilder.new()
            .fee_algo(
                LinearFee.new(
                    BigNum.from_str(protocolParams.min_fee_a.toString()),
                    BigNum.from_str(protocolParams.min_fee_b.toString())
                )
            )
            .pool_deposit(BigNum.from_str(protocolParams.pool_deposit))
            .key_deposit(BigNum.from_str(protocolParams.key_deposit))
            .max_value_size(parseInt(protocolParams.max_val_size))
            .max_tx_size(protocolParams.max_tx_size)
            .coins_per_utxo_byte(BigNum.from_str(protocolParams.coins_per_utxo_size))
            .build();

        const txBuilder = TransactionBuilder.new(txBuilderConfig);
        const senderAddress = Address.from_bech32(gConfig.serviceWallet.address);

        // --- 2. ADD METADATA TO TRANSACTION ---
        const generalMetadata = GeneralTransactionMetadata.new();
        try {
            const chunks = this.createChunkedMetadata(metadata.data[metadata.code]);
            chunks.forEach((chunk, index) => {
                const _index = metadata.code+index;
                generalMetadata.insert(
                    BigNum.from_str(_index.toString()), // Using sequential labels: 
                    TransactionMetadatum.new_text(chunk)
                );
            });
        }
        catch(err) {
            throw err
        }

        const auxiliaryData = AuxiliaryData.new();
        auxiliaryData.set_metadata(generalMetadata);
        txBuilder.set_auxiliary_data(auxiliaryData);

        // --- 3. ADD INPUTS ---
        // Use the first UTXO from service wallet
        const utxo = utxos[0];
        const txInput = TransactionInput.new(
            TransactionHash.from_hex(utxo.tx_hash),
            utxo.output_index
        );
        const inputValue = BigNum.from_str(utxo.amount.find(a => a.unit === 'lovelace').quantity);
        txBuilder.add_input(senderAddress, txInput, Value.new(inputValue));

        // --- 4. ADD OUTPUTS ---
        // Send minimal amount back to service wallet (rest becomes change)
        const outputAddress = Address.from_bech32(gConfig.serviceWallet.address);
        const outputValue = BigNum.from_str('1800000'); // 2 ADA
        const output = TransactionOutput.new(outputAddress, Value.new(outputValue));
        txBuilder.add_output(output);

        // --- 5. CALCULATE FEE AND ADD CHANGE ---
        txBuilder.add_change_if_needed(senderAddress);

        // --- 6. BUILD AND SIGN THE TRANSACTION ---
        const txBody = txBuilder.build();
        const txHash = hash_transaction(txBody);

        const witnesses = TransactionWitnessSet.new();
        const vkeyWitnesses = Vkeywitnesses.new();

        // Use the correct UTXO private key (not root private key)
        const paymentKey = PrivateKey.from_bech32(gConfig.serviceWallet.privateUTXO);
        vkeyWitnesses.add(make_vkey_witness(txHash, paymentKey));

        witnesses.set_vkeys(vkeyWitnesses);
        const signedTx = Transaction.new(txBody, witnesses, auxiliaryData);

        // --- 7. SUBMIT THE TRANSACTION ---
        const txBytes = signedTx.to_bytes();

        const response = await axios.post(
            gConfig.blockfrost.url_preview + "/tx/submit",
            Buffer.from(txBytes),
            {
                headers: {
                    'project_id': gConfig.blockfrost.key_preview,
                    'Content-Type': 'application/cbor'
                }
            }
        );

        console.log('✅ Voting transaction submitted successfully!');
        console.log('Response:', response.data);

        return {
            data: {
                txHash: Buffer.from(txHash.to_bytes()).toString('hex')
            }
        };
    } 
    catch (error) {
      throw {
            data: null,
            status: 400,
            statusText: "Could not submit to cardano"
        };
    }
  }

  /**
   * Utilities 
   */

    metadataToTransactionMetadatum(obj) {
        return TransactionMetadatum.new_text(JSON.stringify(obj));
    }

    getTestnetTxBuilderConfig() {
        // Return testnet transaction builder config
        return {
            fee_algo: {
                coefficient: BigNum.from_str('44'),
                constant: BigNum.from_str('155381')
            },
            pool_deposit: BigNum.from_str('500000000'),
            key_deposit: BigNum.from_str('2000000'),
            max_value_size: 5000,
            max_tx_size: 16384
        };
    }


  /**
   * Collect all voting transactions for a ballot from Cardano blockchain
   */

    async async_collectVotesFromBlockchain(did_ballot) {
        try {
            const allVotingTxs = new Map(); // tx_hash -> transaction
            
            // Query multiple metadata labels 
            const labelQueries = [];
            for (let label = VWD_LABELS.VOTE; label <= (VWD_LABELS.VOTE+99); label++) {
                labelQueries.push(
                    axios.get(
                        `${gConfig.blockfrost.url_preview}/metadata/txs/labels/${label}`,
                        { headers: { 'project_id': gConfig.blockfrost.key_preview } }
                    ).catch(error => {
                        // Some labels might not exist, that's ok
                        if (error.response?.status === 404) return { data: [] };
                        throw error;
                    })
                );
            }
            
            // Execute all queries in parallel
            const responses = await Promise.all(labelQueries);
            
            // Collect all transactions with metadata
            let bigString="";
            responses.forEach(({data}) => {
                if(data && data[0]) {
                    bigString+=data[0].json_metadata;
                }
            });
            

            const splitJsonObjects = (input) => {
                const parts = [];
                let depth = 0, inString = false, escape = false, start = -1;

                for (let i = 0; i < input.length; i++) {
                    const ch = input[i];

                    if (escape) {            // previous was a backslash inside a string
                    escape = false;
                    continue;
                    }
                    if (inString) {
                    if (ch === '\\') escape = true;
                    else if (ch === '"') inString = false;
                    continue;
                    }
                    if (ch === '"') { inString = true; continue; }

                    if (ch === '{') {
                    if (depth === 0) start = i;
                    depth++;
                    } else if (ch === '}') {
                    depth--;
                    if (depth === 0 && start !== -1) {
                        parts.push(input.slice(start, i + 1));
                        start = -1;
                    }
                    }
                }
                return parts;
                }

            const parseConcatenatedJson = (input) => {
                return splitJsonObjects(input.trim()).map(JSON.parse);
            }
            const result = parseConcatenatedJson(bigString);
            
            return { data: result };
            
        } catch (error) {
            throw {
                data: null,
                status: 400,
                statusText: "Could not collect votes from onchain activity"
            };
        }
    }

  /**
   * Publish final results to Ballot DID document on Cardano testnet
   */

    async async_publishFinalResults(did_ballot, results, did_admin) {
        try {
            // Publish hash on-chain (immutable proof)       
            const onChainProof = {
                code: VWD_LABELS.RESULT,
                data: null
            } 
            onChainProof.data[VWD_LABELS.RESULT]= {
                app: gConfig.appName,
                ballot_id: did_ballot,
                results_hash: results.hash,  // Just the hash, not full results
                total_votes: results.totalVotes,
                tallied_at: results.tallied_at,
                certified_by: did_admin
            };
            
            const txHash = await this.async_commitToCardano(onChainProof);
                    
            return { data: {
                txHash: txHash,
                }
            };
        } 
        catch (error) {
            throw {
                data: null,
                status: 400,
                statusText: "Could publish results onchain"
            };
        }
    }

    // Cardano only stores 64 bytes max per "insert"...so we have to cut our data in chuncks
    createChunkedMetadata(data, chunkSize = 60) {
        const jsonString = JSON.stringify(data);
        const chunks = [];
        
        for (let i = 0; i < jsonString.length; i += chunkSize) {
            chunks.push(jsonString.substring(i, i + chunkSize));
        }    
        return chunks;
    }

    async async_get_utxo_with_enough_ADA (utxos) {
        try {
            utxos.forEach((utxo, index) => {
                const amount = parseInt(utxo.amount.find(a => a.unit === 'lovelace').quantity);
                console.log(`UTXO ${index}: ${amount / 1000000} ADA`);
            });

            // Use a UTXO with at least 2.2 ADA
            const largerUtxo = utxos.find(utxo => {
                const amount = parseInt(utxo.amount.find(a => a.unit === 'lovelace').quantity);
                return amount >= 2200000; // At least 2.2 ADA
            });

            if (!largerUtxo) {
                throw  {
                    data: null,
                    status: 400,
                    statusText: "No UTXO with sufficient ADA for this transaction"
                };
            }
            return largerUtxo;
        } 
        catch (error) {
            throw error;
        }
    }

    async async_testTransaction() {
        try {
            console.log('Creating test transaction...');            

            const utxosResponse = await axios.get(
                gConfig.blockfrost.url_preview+`/addresses/${gConfig.serviceWallet.address}/utxos`,
                { headers: { 'project_id': gConfig.blockfrost.key_preview} }
            );

            const utxos = utxosResponse.data;
            if (utxos.length === 0) throw new Error('No UTXOs - wallet empty');

             // --- 1. CONFIGURE THE TRANSACTION BUILDER ---
            // Get the latest network protocol parameters
            const protocolParamsResponse = await axios.get(
                gConfig.blockfrost.url_preview+'/epochs/latest/parameters',
                { headers: { 'project_id': gConfig.blockfrost.key_preview } }
            );
            const protocolParams = protocolParamsResponse.data;
    
            const txBuilderConfig = TransactionBuilderConfigBuilder.new()
                .fee_algo(
                    LinearFee.new(
                        BigNum.from_str(protocolParams.min_fee_a.toString()),
                        BigNum.from_str(protocolParams.min_fee_b.toString())
                    )                                                
                ) 
                .pool_deposit(BigNum.from_str(protocolParams.pool_deposit))
                .key_deposit(BigNum.from_str(protocolParams.key_deposit))
                .max_value_size(parseInt(protocolParams.max_val_size))
                .max_tx_size(protocolParams.max_tx_size)             
                .coins_per_utxo_byte(BigNum.from_str(protocolParams.coins_per_utxo_size)) // Correct parameter name for recent CSL versions
                .build(); 
            const txBuilder = TransactionBuilder.new(txBuilderConfig);
            const senderAddress = Address.from_bech32(gConfig.serviceWallet.address);

            const generalMetadata = GeneralTransactionMetadata.new();
            try {
                const metadata = {
                    app: "VoteWithDID",
                    did: "did:prism:d145fa7ac48cd57f26b9cd09e2022e897ad701dbe1899eff9c087563948be4e2",
                    aV: [
                        {
                        enc: "8cf3a2e7aee1f75a4ae7cb86b16e4044:05a18b7ee650fd390701690aa9668a3a07844adf612037d0401763e229e80016",
                        zkp: "009c75b56d43b31210ad623b9f8571f433c15f7f2a97a309b7f096f1df60c639",
                        },
                    ],                                                                
                }
                const chunks = this.createChunkedMetadata(metadata);
                chunks.forEach((chunk, index) => {
                    const _index = VWD_LABELS.VOTE+index;
                    generalMetadata.insert(
                        BigNum.from_str(_index.toString()), // Using sequential labels:
                        TransactionMetadatum.new_text(chunk)
                    );
                });

            }
            catch(err) {
                throw err
            }

            const auxiliaryData = AuxiliaryData.new();
            auxiliaryData.set_metadata(generalMetadata);
            txBuilder.set_auxiliary_data(auxiliaryData);

            // --- 2. ADD INPUTS ---
            // get best match utxo
            const utxo = await this.async_get_utxo_with_enough_ADA(utxos);
            const txInput = TransactionInput.new(
                TransactionHash.from_hex(utxo.tx_hash),
                utxo.output_index
            );
            const inputValue = BigNum.from_str(utxo.amount.find(a => a.unit === 'lovelace').quantity);
            txBuilder.add_input(senderAddress, txInput, Value.new(inputValue));

            // --- 3. ADD OUTPUTS ---
            // Send 2 ADA back to the sender's address
            const outputAddress = Address.from_bech32(gConfig.serviceWallet.address);
            const outputValue = BigNum.from_str('1800000'); // 1.8 ADA in lovelace
            const output = TransactionOutput.new(outputAddress, Value.new(outputValue));
            txBuilder.add_output(output);

            // --- 4. CALCULATE FEE AND ADD CHANGE  ---
            txBuilder.add_change_if_needed(senderAddress);
            
             // --- 5. BUILD AND SIGN THE TRANSACTION ---
            const txBody = txBuilder.build();

            const txHash = hash_transaction(txBody);
            const witnesses = TransactionWitnessSet.new();
            const vkeyWitnesses = Vkeywitnesses.new();

            const paymentKey = PrivateKey.from_bech32(gConfig.serviceWallet.privateUTXO);
            vkeyWitnesses.add(make_vkey_witness(txHash, paymentKey));

//            const stakePrivateKey = PrivateKey.from_bech32(gConfig.serviceWallet.stakeKey); 
//            vkeyWitnesses.add(make_vkey_witness(txHash, stakeRawKey));

            witnesses.set_vkeys(vkeyWitnesses);

            const signedTx = Transaction.new(txBody, witnesses, auxiliaryData);

            // --- 6. SUBMIT THE TRANSACTION ---
             // We submit the raw transaction bytes, not a hex string.
            const txBytes = signedTx.to_bytes();
    
            const response = await axios.post(gConfig.blockfrost.url_preview+"/tx/submit",
                Buffer.from(txBytes),
                {
                    headers: {
                        'project_id': gConfig.blockfrost.key_preview, 
                        'Content-Type': 'application/cbor' 
                    }
                }
            );
            
            console.log('✅ Transaction submitted successfully!');
            console.log('Response:', response.data);
            console.log('Check your Eternl wallet in a few minutes');
            
            return {data: {txHash: txHash}};
            
        } catch (error) {
            console.error('❌ Transaction failed:', error.response?.data || error.message);
            throw error;
        }
    }

}

module.exports = AnonymousVoting;