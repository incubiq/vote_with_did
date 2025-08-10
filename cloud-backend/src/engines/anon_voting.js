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
const util_cardano = require('../utils/util_cardano');



/**
 * Anonymous Voting Backend Service for NodeJS
 * Handles vote submission, tallying, and results publication to Cardano (testnet)
 */

class AnonymousVoting {
  constructor(config) {
    
    this.batchInterval = config?.batchInterval || (60 * 60 * 1000); // 1 hour default
    this.startBatchTimer();

    // In-memory storage 
    this.uncommitedVotes = [];
  }

/**
 *  Scheduling
 */

    startBatchTimer() {
        setInterval(async () => {
            await this.commitAllPendingBatches();
        }, this.batchInterval || 3600000);
    }

    async commitAllPendingBatches() {
        if (this.uncommitedVotes.length > 0) {
    
            // Group votes by ballot
            const votesByBallot = this.groupVotesByBallot(this.uncommitedVotes);
            
            for (const [did_ballot, votes] of votesByBallot) {
                const metadata = {
                    code: 674,
                    data: {
                        674: { // Standard voting metadata label
                            did_ballot: did_ballot,
                            batch_votes: votes,
                            batch_timestamp: new Date().toISOString()
                        }
                    }
                };
                await this.async_commitToCardano(metadata);
            }
            
            this.uncommitedVotes = []; // Clear after commit
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
 * Voting (commit to mem + to onchain)
 */

  async commitVote(objVote) {
    this.uncommitedVotes.push(objVote);      
  }

  async async_commitToCardano(metadata) {
    try {
        // Prepare transaction metadata
        
        // Build transaction using Cardano Serialization Library
        const txBuilder = TransactionBuilder.new(
            this.getTestnetTxBuilderConfig()
        );

        // Add metadata to transaction
        const generalMetadata = GeneralTransactionMetadata.new();
        generalMetadata.insert(
            BigNum.from_str(metadata.code),
            this.metadataToTransactionMetadatum(metadata.data[metadata.code])
        );

        const auxiliaryData = AuxiliaryData.new();
        auxiliaryData.set_metadata(generalMetadata);
        txBuilder.set_auxiliary_data(auxiliaryData);

        // Add minimal output (send back to ballot manager wallet)
        const outputAddress = Address.from_bech32(gConfig.serviceWallet.address);
        const outputValue = Value.new(BigNum.from_str('1500000')); // 1.5 ADA
        const output = TransactionOutput.new(outputAddress, outputValue);
        txBuilder.add_output(output);
    
        // Set transaction auxiliary data
        txBuilder.set_auxiliary_data(auxiliaryData);

        // Build transaction body
        const txBody = txBuilder.build();

        // SIGN the transaction with service wallet private key
        const privateKey = PrivateKey.from_bech32(gConfig.serviceWallet.privateKey);
        const vkeyWitness = make_vkey_witness(txBody.hash(), privateKey);
        
        const witnessSet = TransactionWitnessSet.new();
        witnessSet.add_vkey(vkeyWitness);
        
        // Create signed transaction
        const signedTx = Transaction.new(txBody, witnessSet, auxiliaryData);
        const txHash = Buffer.from(txBody.hash().to_bytes()).toString('hex');

        // Submit signed transaction to Cardano testnet
        const submissionResult = await this.async_submitVoteOnchain(signedTx);      
 
        return {data: {
            txHash:txHash
        }}
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
   * Submit Vote transaction to Cardano (testnet) via Blockfrost API
   */
  async async_submitVoteOnchain(transaction) {
    try {
      const txBytes = Buffer.from(transaction.to_bytes()).toString('hex');      
      const response = await axios.post(
        `${gConfig.blockfrost.url_preview}/tx/submit`,
        txBytes,
        {
          headers: {
            'project_id': gConfig.blockfrost.key_preview,
            'Content-Type': 'application/cbor'
          }
        }
      );
      
      console.log('Transaction submitted to testnet:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Vote submission failed:', error.response?.data || error.message);
      throw {
            data: null,
            status: 400,
            statusText: "Could not submit vote onchain"
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
            // Query Blockfrost for transactions with voting metadata (label 674)
            const response = await axios.get(
                `${gConfig.blockfrost.url_preview}/metadata/txs/labels/674`,
                { headers: { 'project_id': gConfig.blockfrost.key_preview } }
            );
            
            // Filter for this specific ballot and extract votes
            const ballotVotes = [];
            response.data.forEach(tx => {
                if (tx.json_metadata?.did_ballot === did_ballot) {
                    // Could be single vote or batch
                    if (tx.json_metadata.batch_votes) {
                        ballotVotes.push(...tx.json_metadata.batch_votes);
                    } else {
                        ballotVotes.push(tx.json_metadata);
                    }
                }
            });
            
            return {data: ballotVotes};            
        } 
        catch (error) {
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
                code: 675,
                data: {
                    675: {
                        ballot_id: did_ballot,
                        results_hash: results.hash,  // Just the hash, not full results
                        total_votes: results.totalVotes,
                        tallied_at: results.tallied_at,
                        certified_by: did_admin
                    }
                }
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

            // --- 2. ADD INPUTS ---
            // For simplicity, we'll use the first UTXO.
            const utxo = utxos[0];
            const txInput = TransactionInput.new(
                TransactionHash.from_hex(utxo.tx_hash),
                utxo.output_index
            );
            const inputValue = BigNum.from_str(utxo.amount.find(a => a.unit === 'lovelace').quantity);
            txBuilder.add_input(senderAddress, txInput, Value.new(inputValue));

            // --- 3. ADD OUTPUTS ---
            // Send 2 ADA back to the sender's address
            const outputAddress = Address.from_bech32(gConfig.serviceWallet.address);
            const outputValue = BigNum.from_str('2000000'); // 2 ADA in lovelace
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

            const signedTx = Transaction.new(txBody, witnesses);

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