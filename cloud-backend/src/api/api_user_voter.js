const jwtDecode = require('jwt-decode');
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
    
    // ensure that we know this kind of wallet (chain + wallet name (LACE, NAMI, ...) )
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

    async async_getUserWithDID(objParam) {
        try {            
            let objUser=cUsers.getUserFromKey(objParam.key);
            if(!objUser) {
                throw {
                    data: null,
                    status: 404,
                    statusText: "Unknown user"
                }
            }

            // no DID? get it before continuing...
            if(objUser.did==null) {
                const dataDID = await utilsIdentity.async_getDidForEntity({
                    key: objParam.key
                });

                objUser = cUsers.addDidToUser(objUser.username, dataDID.data[0].did);
            }

            return objUser;

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

                // we do not return user if repeated calls (here within 1min)
                if(objUser.dateLock) {
                    const now = new Date();
                    const oneMinuteFromLock = new Date(objUser.dateLock.getTime() + 60 * 1000);
                    if(Math.abs(oneMinuteFromLock.getTime()  - now.getTime() > 0 )) {
                        throw {
                            data: null,
                            status: 400,
                            statusText: "Avoided multiple calls to Proof of Ownership (lock in action)"
                        }        
                    }    
                }
                else {
                    cUsers.addProcessLockToUser(objUser.username);
                }

                // ensure DID
                if(objUser.did==null) {
                    objUser=await this.async_getUserWithDID(objParam);
                }

                // if we already have a Proof in cache, we return it
                if(objUser.aProof && objUser.aProof.length>0) {
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

                if(dataProofs && dataProofs.data && dataProofs.data.length>0) {
                    // list all proofs, see if one is our match
                    const now = new Date();
                    for (var i=0; i<dataProofs.data.length; i++) {
                        const decoded_wrapper = jwtDecode(dataProofs.data[i].data[0]);
                        const encoded_proof=decoded_wrapper.vp.verifiableCredential[0];
                        const decoded_proof = jwtDecode(encoded_proof);
                        const dateExpire = new Date(decoded_proof.exp * 1000);

                        if(decoded_proof.vc.credentialSubject && 
                            decoded_proof.vc.credentialSubject.claim_type==objParam.claim_type &&
                            decoded_proof.vc.credentialSubject.address==objParam.address) {
                            // check if the proof is still valid
                            if(dateExpire>now) {
                                // we have a match, add to cache and return it
                                decoded_proof.vc.credentialSubject.expire_at=dateExpire;
                                cUsers.addProofToUser(objUser.username, decoded_proof.vc.credentialSubject);
                                return decoded_proof.vc.credentialSubject;
                            }
                        }
                    }
                }
                
                // no proof? make it now
                // get admin key and connection with peer
                let connection = null;
                let dataConnect = await utilsConnection.async_getAllConnectionsForEntity({
                    key: objUser.key,
                });

                if(!dataConnect.data || dataConnect.data.length==0) {
                    dataConnect = await utilsConnection.async_createCustodialConnection({
                        keyPeer1: gConfig.vwd.key,
                        namePeer1: "VoteWithDID (admin)",
                        keyPeer2: objUser.key,
                        namePeer2: objUser.username
                    })

                    if(!dataConnect.data || dataConnect.data.length==0) {
                        throw { 
                            data: null,
                            status: 404,
                            statusText: "Connection with peer not created"
                        }
                    }
                    connection = dataConnect.data;
                }
                else {
                    connection = dataConnect.data[0];   // get the first connection between the peers (ASSUMES that USER will NOT Issue/be issued connection with any other party)
                }

                // get the connection from ADMIN point of view (via THID)
                dataConnect = await utilsConnection.async_getAllConnectionsForEntity({
                    key: gConfig.vwd.key,
                    thid: connection.thid
                });

                if(!dataConnect.data || dataConnect.data.length==0) {
                    throw { 
                        data: null,
                        status: 404,
                        statusText: "Connection with peer not found (admin viewpoint)"
                    }
                }

                // the connection is the one from VwD admin viewpoint
                connection = dataConnect.data[0];

                const  claims={
                    address: objParam.address,
                    chain: objParam.chain,
                    networkId: objParam.networkId,
                    claim_type: objParam.claim_type,
                };

                // in case claim was created already, we get it
                let dataExist=null;
                let vc=null;
                try {
                    dataExist= await utilsCreds.async_getFirstHolderVCMatchingType({
                        key: objUser.key,
                        claim_type: objParam.claim_type
                    });   
                    
                    if(dataExist && dataExist.data) {
                        vc=dataExist.data.vc;
                    }
                }
                catch(err) {}

                // no claim yet, we get one
                if(!vc) {
                    const dataCreds = await utilsCreds.async_createCustodialCredential({
                        connection:  connection.connectionId,    
                        keyPeer1: gConfig.vwd.key,
                        keyPeer2: objUser.key,
                        didPeer1:  gConfig.vwd.did,          // published short DID of issuer
                        didPeer2:  objUser.did,              // published short DID of holder
                        validity:  gConfig.identus.validity,           // 30d by default
                        claims: claims,             
                        noDuplicate: true
                    });

                    vc = dataCreds.data.vc;    
                }

                // now we generate a proof for this claim
                cUsers.addProofToUser(objUser.username, claims);
                const dataProof = await utilsProof.async_createCustodialProof({
                    noDuplicate: true,
                    keyPeer1: gConfig.vwd.key,
                    keyPeer2: objUser.key,
                    connection: connection.connectionId,
                    claim_type: objParam.claim_type,
                    domain : "votewithdid.com",
                    thid: vc.thid,
                });

                return dataProof;
            }
            catch(err) {
                throw err;
            }
        }
}

module.exports = api_user_voter;