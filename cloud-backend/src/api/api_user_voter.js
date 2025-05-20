const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const utilsCreds = require('../utils/util_identus_credentials');
const utilsProof = require('../utils/util_identus_proof');
const utilsIdentity = require('../utils/util_identus_identity');
const utilsConnection = require('../utils/util_identus_connections');
const cEvents = require('../const/const_events');
const cUsers = require('../const/const_users');
const { connection } = require('mongoose');

/*   
 *      User / VOTER APIs
 */

class api_user_voter extends apiBase {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

//        const classDBVoter = require('../dbaccess/db_voter');
//        this.dbVoter=new classDBVoter({stdTTL: 864000});   // 10 day cache...

        const classDBWalletType = require('../dbaccess/db_wallet_type');
        this.dbWalletType=new classDBWalletType({stdTTL: 864000});   // 10 day cache...
    }


/*
 *  Public APIs   
 */

    async async_ensureWalletType(objParam) {
        try {            
            // exist?
            let objWT=await this.dbWalletType.async_findWalletType({
                chain: objParam.chain,
                id: objParam.id,
                deleted_at: null
            });
            
            if(!objWT) {
                // create it
                objWT={
                    chain: objParam.chain,
                    id: objParam.id,
                    networkId: objParam.networkId,
                    name: objParam.name,
                    logo: objParam.logo,
                };
                objWT=await this.dbWalletType.async_createWalletType(objWT);
            }
            return objWT;            
        }
        catch(err) {
            throw err;
        }
    }


        async async_ensureProofOfOwnership(objParam) {
            try {
                let objUser=cUsers.getUserFromKey(objParam.key);
                if(!objUser) {
                    throw {
                        data: null,
                        status: 404,
                        statusText: "Unknown user"
                    }
                }

                // if we already have a Proof in cache, we return it
                if(objUser.aProof) {
                    const iProof=objUser.aProof.findIndex(function (x) {return (x.address==objParam.address)});
                    if(iProof!=-1) {
                        return objUser.aProof[iProof];
                    }
                }
                
                // look if the proof was created before
                const dataProofs= await utilsProof.async_getAllVCPresentationRequests({
                    key: objUser.key,
                    status: utilsProof.STATUS_PROVER_PROOF_SENT
                });

                if(dataProofs && dataProofs.length>0) {
                    // list all proofs, see if one is our match
                    const now = new Date();
                    for (var i=0; i<dataProofs.length; i++) {
                        const decoded_wrapper = jwtDecode(dataProofs[i]);
                        const encoded_proof=decoded_wrapper.vp.verifiableCredential[0];
                        const decoded_proof = jwtDecode(encoded_proof);
                        const dateExpire = new Date(decoded_proof.exp * 1000);

                        if(decoded_proof.vc.credentialSubject && 
                            decoded_proof.vc.credentialSubject.claim_type==objParam.claim_type &&
                            decoded_proof.vc.credentialSubject.address==objParam.address) {
                            // check if the proof is still valid
                            if(dateExpire>now) {
                                // we have a match, add to cache and return it
                                cUsers.addProofToUser(objUser.username, decoded_proof.vc.credentialSubject);
                                return decoded_proof.vc.credentialSubject;
                            }
                        }
                    }
                }
                
                // no proof? make it now
                // get admin key and connection with peer
                let dataConnect = await utilsConnection.async_getAllConnectionsForEntity({
                    key: objUser.key,
                });

                if(!dataConnect || dataConnect.length==0) {
                    dataConnect = await utilsConnection.async_createCustodialConnection({
                        keyPeer1: gCongig.identus.adminKey,
                        namePeer1: "Identus admin",
                        keyPeer2: objUser.key,
                        namePeer2: objUser.username
                    })

                    if(!dataConnect || dataConnect.length==0) {
                        throw { 
                            data: null,
                            status: 404,
                            statusText: "Connection with peer not found"
                        }
                    }
                }

                const  claims={
                    address: objParam.stake_address,
                    chain: objParam.chain,
                    networkId: objParam.networkId,
                    claim_type: objParam.claim_type,
                };

                const dataCreds = await utilsCreds.async_createCustodialCredential({
                    connection:  data[0].connection_id_from,    // get the connectionId of the first one
                    keyPeer1: gCongig.identus.adminKey,
                    keyPeer2: objUser.key,
                    didPeer1:  objUser.key,         // published short DID of issuer
                    didPeer2:  data[0].keyPeer2,         // published short DID of holder
                    validity:  gConfig.identus.validity,           // 30d by default
                    claims: claims,             
                    noDuplicate: true
                });

                cUsers.addProofToUser(objUser.username, claims);
                const dataProof = await utilsProof.async_createCustodialProof({
                    noDuplicate: true,
                    keyPeer1: objUser.keyPeer1,
                    keyPeer2: objUser.keyPeer2,
                    connection: data[0].connection_id_from,
                    claim_type: objParam.claim_type,
                    thid: dataClaim.thid,
                });

                return dataProof;
            }
            catch(err) {
                throw err;
            }
        }
}

module.exports = api_user_voter;