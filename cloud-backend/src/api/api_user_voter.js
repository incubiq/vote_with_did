const jwtDecode = require('jwt-decode');
const apiViewer = require('./api_user_viewer');
const utilServices = require('../utils/util_services');
const utilsCreds = require('../utils/util_identus_credentials');
const utilsProof = require('../utils/util_identus_proof');
const utilsIdentity = require('../utils/util_identus_identity');
const utilsConnection = require('../utils/util_identus_connections');
const utilsBlockfrost = require('../utils/util_blockfrost');
const cEvents = require('../const/const_events');
const cUsers = require('../const/const_users');
const { connection } = require('mongoose');

/*   
 *      User / VOTER APIs
 */

class api_user_voter extends apiViewer {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

    }


/*
 *  Voter (user)
 */
    
    async async_getUser(objParam) {
        try {
            const dataUser = await this.async_getUserWithDID(objParam)
            return {data : [{
                username: dataUser.data.username,
                did : dataUser.data.did,
                isViewer: true,
                isVoter: true,
                isDesigner: false,
                isAdmin: false,
                canCreateBallot: false,
                canEditBallot: false,
                canPublishBallot: false,

            }]}
        }
        catch(err) {
            throw err;
        }
    }

    async async_getUserDIDs(objParam) { 
        try {
            const dataUser = await this.async_getUserWithDID(objParam)
            return {data : [{
                did : dataUser.data.did,
                status: "PUBLISHED"
            }]}
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

            return {data: objUser};

        }
        catch(err) {
            throw err;
        }
    }

    async async_getUserWithProofs(objParam) {
        try {            
            const dataUser=await this.async_getUserWithDID(objParam);
            let objUser=dataUser.data;
            if(!objUser) {
                return {data: null}
            }

            // if we already have a Proof in cache, we return it
            if(objUser.aProof && objUser.aProof.length>0) {
                return {
                    data: objUser.aProof
                }
            }
            
            // look if the proof was created before
            const dataProofs= await utilsProof.async_getAllVCPresentationRequests({
                key: objUser.key,
                claim_type: objParam.claim_type,
                status: utilsProof.STATUS_PROVER_PROOF_SENT
            });

            if(dataProofs && dataProofs.data && dataProofs.data.length>0) {
                // list all proofs, see if one is our match
                const now = new Date();
                for (var i=0; i<dataProofs.data.length; i++) {
                    // no duplicate 
                    const iFound=objUser.aProof.findIndex(function (x) {return x.thid===dataProofs.data[i].thid})
                    if(iFound==-1) {
                        objUser = cUsers.addProofToUser(objUser.username, dataProofs.data[i]);
                    }
                }
            }
            
            return {data: objUser.aProof};

        }
        catch(err) {
            throw err;
        }
    }
    async _async_authorize(objParam) {
        try {
            let objUser=cUsers.getUserFromKey(objParam.key);
            if(!objUser) {
                throw {
                    data: null,
                    status: 404,
                    statusText: "Unknown user"
                }
            }

            // for now, we accept upgrade of access rights in exchange of nothing
            cUsers.addAccessRightToUser(objUser.username, {
                canEditBallot: objParam.canEditBallot,
                canCreateBallot: objParam.canCreateBallot,
                canPublishBallot: objParam.canPublishBallot
            })
            objUser.isAdmin=objParam.canCreateBallot==true;
            objUser.isDesigner=objParam.canEditBallot==true;
            return {data: objUser}
        }
        catch(err) {
            throw err;
        }
    }
    async async_authorizeAdmin(objParam) {
        return this._async_authorize({
            key: objParam.key, 
            canEditBallot: true,
            canCreateBallot: true,
            canPublishBallot: true
        })
    }

    async async_authorizeDesigner(objParam) {
        return this._async_authorize({
            key: objParam.key, 
            canEditBallot: true,
            canCreateBallot: false,
            canPublishBallot: false
        })
    }

    async async_authorizeVoter(objParam) {
        return this._async_authorize({
            key: objParam.key, 
            canEditBallot: false,
            canCreateBallot: false,
            canPublishBallot: false
        })
    }

/*
 *  Proof for Voter
 */

    async async_ensureProof(objParam, objClaim) {
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
                if(objUser.dateLock && objUser.aProof.length==0) {
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
                    const dataUser=await this.async_getUserWithDID(objParam);
                    objUser=dataUser.data;
                }

                // do we have a proof already?
                const dataExistingProof =  await this.async_getUserWithProofs(objParam);
                if(dataExistingProof.data && dataExistingProof.data.length>0 && dataExistingProof.data[0].claims!=null && dataExistingProof.data[0].proof!=null) {
                    // only keep same claim_type
                    let _aRet=[];
                    dataExistingProof.data.forEach(item => {
                        if(item.claims && item.claims.claim_type==objClaim.claim_type) {
                            _aRet.push(item);
                        }
                    })
                    if(_aRet.length>0) {
                        return _aRet;
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

                // in case claim was created already, we get it
                let dataExist=null;
                let vc=null;
                try {
                    dataExist= await utilsCreds.async_getFirstHolderVCMatchingType({
                        key: objUser.key,
                        claim_type: objClaim.claim_type
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
                        claims: objClaim,             
                        noDuplicate: true
                    });

                    vc = dataCreds.data.vc;    
                }

                // now we generate a proof for this claim
                const dataProof = await utilsProof.async_createCustodialProof({
                    noDuplicate: true,
                    keyPeer1: gConfig.vwd.key,
                    keyPeer2: objUser.key,
                    connection: connection.connectionId,
                    claim_type: objClaim.claim_type,
                    domain : "votewithdid.com",
                    thid: vc.thid,
                });

                cUsers.addProofToUser(objUser.username, {
                    claims: objClaim,
                    proof: dataProof.data.proof,
                    status:  utilsProof.STATUS_PROVER_PROOF_SENT,
                    thid: dataProof.data.thid
                });


                return dataProof;
            }
            catch(err) {
                throw err;
            }
        }

        
    async async_ensureProofOfOwnership(objParam) {

        return this.async_ensureProof(objParam, {
            address: objParam.address,
            chain: objParam.chain,
            networkId: objParam.networkId,
            claim_type: "address_ownership",
        })        
    }

    async async_issueProofOfFunds (objParam) {
        try {
            const objAssets = await utilsBlockfrost.async_getWalletAssetsFromAddress(objParam.address)
            return this.async_ensureProof(objParam, {
                address: objParam.address,
                chain: objParam.chain,
                networkId: objParam.networkId,
                token: "ADA",
                value: objAssets.adaAmount,
                claim_type: "proof_of_fund",
            }) 
        }
        catch(err) {
            throw err;
        }
    }
}

module.exports = api_user_voter;