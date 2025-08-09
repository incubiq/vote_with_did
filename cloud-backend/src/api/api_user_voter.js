const jwtDecode = require('jwt-decode');
const crypto = require('crypto');
const apiViewer = require('./api_user_viewer');
const utilServices = require('../utils/util_services');
const utilsCreds = require('../utils/util_identus_credentials');
const utilsProof = require('../utils/util_identus_proof');
const utilsIdentity = require('../utils/util_identus_identity');
const utilsConnection = require('../utils/util_identus_connections');
const utilsBlockfrost = require('../utils/util_blockfrost');
const srvIdentusProof = require("../utils/util_identus_proof");
const cEvents = require('../const/const_events');
const cUsers = require('../const/const_users');
const cClaims = require('../const/const_claims');

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
                canAddQuestion: false,
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
                canAddQuestion: objParam.canAddQuestion,
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
            canAddQuestion: true,
            canEditBallot: true,
            canCreateBallot: true,
            canPublishBallot: true
        })
    }

    async async_authorizeDesigner(objParam) {
        return this._async_authorize({
            key: objParam.key, 
            canAddQuestion: true,
            canEditBallot: false,
            canCreateBallot: false,
            canPublishBallot: false
        })
    }

    async async_authorizeVoter(objParam) {
        return this._async_authorize({
            key: objParam.key, 
            canAddQuestion: false,
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
                    if(oneMinuteFromLock.getTime() > now.getTime()) {
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
                            if(objClaim?.delegatedAuthority==null || objClaim.delegatedAuthority==item.claims.delegatedAuthority) {
                                _aRet.push(item);
                            }
                        }
                    })
                    if(_aRet.length>0) {
                        return {data: _aRet[0]};        // we return the first valid one
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
                        keyPeer1: objParam.key_issuer,
                        namePeer1: objParam.name_issuer,
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
                    key: objParam.key_issuer,
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
                        claim_type: objClaim.claim_type,
                        delegatedAuthority: objClaim.delegatedAuthority
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
                        keyPeer1: objParam.key_issuer,
                        keyPeer2: objUser.key,
                        didPeer1:  objParam.did_issuer,          // published short DID of issuer
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
                    keyPeer1: objParam.key_issuer,
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
        // issuer is VwD
        if(!objParam.key_issuer) {objParam.key_issuer=gConfig.vwd.key;}
        if(!objParam.did_issuer) {objParam.did_issuer=gConfig.vwd.did;}
        if(!objParam.name_issuer) {objParam.name_issuer="VoteWithDID (admin)";}

        const objUser = cUsers.getUserFromKey(objParam.key);
        if(objUser && objUser.aProof) {
            // if we have the proof, we show it now...
            let objProof=null;
            objUser.aProof.forEach(item => {
                if(item?.claims?.claim_type==cClaims.CLAIM_ADDRESS_OWNERSHIP.value) {
                    objProof=item;
                }
            })
            if(objProof) {return {data: objProof}}
        }

        let objClaim = {
            address: objParam.address,
            chain: objParam.chain,
            networkId: objParam.networkId,
            claim_type: cClaims.CLAIM_ADDRESS_OWNERSHIP.value,
        }
        if(objParam.delegatedAuthority) {
            objClaim.delegatedAuthority=objParam.delegatedAuthority;
        }
        return this.async_ensureProof(objParam, objClaim);
    }

    async async_issueProofOfFunds (objParam) {
        try {
            // issuer is VwD
            if(!objParam.key_issuer) {objParam.key_issuer=gConfig.vwd.key;}
            if(!objParam.did_issuer) {objParam.did_issuer=gConfig.vwd.did;}
            if(!objParam.name_issuer) {objParam.name_issuer="VoteWithDID (admin)";}

            const objAssets = await utilsBlockfrost.async_getWalletAssetsFromAddress(objParam.address)
            let objClaim = {
                address: objParam.address,
                chain: objParam.chain,
                networkId: objParam.networkId,
                token: objParam.token? objParam.token: "ADA",
                value: objAssets.adaAmount,
                claim_type: cClaims.CLAIM_PROOF_OF_FUNDS.value,
            }
            
            // delegated??
            if(objParam.uid_ballot) {
                const dataBallot =  await gConfig.app.apiBallot.async_findBallotForVoter({
                    uid: objParam.uid_ballot,
                    mustBeOpenToVote: false
                })
                objClaim.delegatedAuthority= dataBallot.data.published_id;
            }

            return this.async_ensureProof(objParam, objClaim); 
        }
        catch(err) {
            throw err;
        }
    }

    async async_issueProofOfMinimumBalance (objParam) {
        try {
            // issuer is VwD
            if(!objParam.key_issuer) {objParam.key_issuer=gConfig.vwd.key;}
            if(!objParam.did_issuer) {objParam.did_issuer=gConfig.vwd.did;}
            if(!objParam.name_issuer) {objParam.name_issuer="VoteWithDID (admin)";}

            const objAssets = await utilsBlockfrost.async_getAllWalletAssets(objParam.address)
            if(objAssets.adaAmount<objParam.requirement_minimum) {
                throw ({
                    data: null,
                    status: 403,
                    statusText: "Minimum balance requirement not met"
                })
            }
            let objClaim = {
                address: objParam.address,
                chain: objParam.chain,
                networkId: objParam.networkId,
                token: objParam.token? objParam.token: "ADA",
                minimum_requirement: objParam.requirement_minimum,
                accepted: true,
                requested_by: objParam.did_issuer,
                claim_type: cClaims.CLAIM_PROOF_OF_MINIMUM_BALANCE.value,
            }

            // delegated??
            if(objParam.uid_ballot) {
                const dataBallot =  await gConfig.app.apiBallot.async_findBallotForVoter({
                    uid: objParam.uid_ballot,
                    mustBeOpenToVote: false
                })
                objClaim.delegatedAuthority= dataBallot.data.published_id;
            }

            return this.async_ensureProof(objParam, objClaim);
        }
        catch(err) {
            throw err;
        }
    }

/* 
 *      VOTE 
 */

    async async_issueProofOfVote (objParam) {
        try {
            if(!objParam.uid_ballot) {
                throw ({
                    data: null,
                    status: 400,
                    statusText: "Needs a ballot ref to accept vote"
                })
            }

            // issuer is VwD
            if(!objParam.key_issuer) {objParam.key_issuer=gConfig.vwd.key;}
            if(!objParam.did_issuer) {objParam.did_issuer=gConfig.vwd.did;}
            if(!objParam.name_issuer) {objParam.name_issuer="VoteWithDID (admin)";}

            const dataBallot =  await gConfig.app.apiBallot.async_findBallotForVoter({
                uid: objParam.uid_ballot,
                mustBeOpenToVote: true
            });

            let objClaim = {
                certificates_of_elegibility: objParam.a_thid_eligibility? objParam.a_thid_eligibility : [],
                hasVoted: true,
                requested_by: objParam.did_issuer,
                delegatedAuthority: dataBallot.data.published_id,
                claim_type: cClaims.CLAIM_PROOF_OF_VOTE.value,
            }

            return this.async_ensureProof(objParam, objClaim);
        }
        catch(err) {
            throw err;
        }
    }

    async async_canVote(objParam) {
        try {
            // get ballot 
            const dataBallot=await gConfig.app.apiBallot.async_findBallotForVoter({
                uid: objParam.uid
            });

            // pass if has already voted
            const objUser=cUsers.getUserFromDid(objParam.did);
            if(cUsers.hasVoted(objUser.username, objParam.uid)) {
                return {
                    data: {
                        ballot: dataBallot.data,
                        user: objParam.did,
                        canVote: false,
                        hasVoted: true,
                    }
                }
            }

            // look if the proof of VOTE was created before (but not registered or unfinished)
            const dataProofs= await utilsProof.async_getAllVCPresentationRequests({
                key: objUser.key,
                claim_type: cClaims.CLAIM_PROOF_OF_VOTE.value,
                status: "*" //utilsProof.STATUS_PROVER_PROOF_SENT           // we cannot trust that identus has issued it fully, so we take all those even partial 
            });

            if(dataProofs?.data?.length>0) {
                for (var i=0; i<dataProofs.data.length; i++) {
                    
                    // was partially issued??
                    if(dataProofs.data.status!==utilsProof.STATUS_PROVER_PROOF_SENT) {
                        // check we have a issued Certif 
                        const dataCert = await utilsCreds.async_getFirstHolderVCMatchingType({
                            key: objUser.key,
                            claim_type: cClaims.CLAIM_PROOF_OF_VOTE.value,
                            delegatedAuthority: dataBallot.data.published_id
                        });   

                        if(dataCert.data) {
                            // we have the proof we were issued VC, continue issuance of Proof
                            // continue issuance... (do not await, consider voted true)
                            this.async_issueProofOfVote({
                                key: objUser.key,
                                uid_ballot: objParam.uid,
                                a_thid_eligibility: objParam.aUserProof
                            });

                            return {
                                data: {
                                    ballot: dataBallot.data,
                                    user: objParam.did,
                                    canVote: false,
                                    hasVoted: true,
                                }
                            }
                        }
                    }
                    else {
                        if(dataProofs.data[i].claims?.delegatedAuthority==dataBallot.data.published_id) {
                            cUsers.addBallotVoteToUser(objUser.username, objParam.uid);
                            return {
                                data: {
                                    ballot: dataBallot.data,
                                    user: objParam.did,
                                    canVote: false,
                                    hasVoted: true,
                                }
                            }
                        }

                    }
                }

                // we received some proofs, but they were not for us... So we probably have not voted yet...
            }

            // check what claims we have to provide
            let bShowedEnoughProof = true;
            for (var i=0; i<dataBallot.data.aCreds.length; i++) {
                const _claim = dataBallot.data.aCreds[i].type;
                
                // check if we can fulfill this claim
                if(_claim && _claim!=="none") {

                    // compare the user proof with requirement
                    let hasProof = false;
                    objUser.aProof.forEach(_proof => {
                        if(objParam.aProof.includes(_proof.thid)) {
                            hasProof=true;
                        }
                    })

                    bShowedEnoughProof=hasProof && bShowedEnoughProof;
                }
            }

            return {
                data: {
                    ballot: dataBallot.data,
                    user: objParam.did,
                    canVote: bShowedEnoughProof,
                    hasVoted: false,
                }
            }
        }
        catch(err) {
            throw err;
        }
    }

    async async_vote(objParam) {
        try {
            // get ballot 
            const dataCanVote=await this.async_canVote({
                uid: objParam.uid,
                did: objParam.did,
                aUserProof: objParam.aProof
            });

            if(!dataCanVote.data.canVote) {
                //
                if(dataCanVote.data.hasVoted) {
                    throw {
                        data: null,
                        status: 401,
                        statusText: "You have already voted."
                    }
                }
                else {
                    throw {
                        data: null,
                        status: 401,
                        statusText: "Not enough credentials to prove eligibility."
                    }
                }
            }

            // now vote 
            await gConfig.app.apiBallot.async_vote({
                uid: objFind.uid,
                did: objFind.did
            }, objParam.aProof, objParam.aVote);


            // issue certif of vote (do not await)
            const objUser=cUsers.getUserFromDid(objParam.did);
            cUsers.addBallotVoteToUser(objUser.username, objParam.uid);
            this.async_issueProofOfVote({
                key: objParam.key,
                uid_ballot: objParam.uid,
                a_thid_eligibility: objParam.aProof
            });

            return {
                data: {
                    hasShownEnoughProof: dataCanVote.data.canVote,
                    hasVoted: true
                }
            }
        }
        catch(err) {
            throw err;
        }
    }

/* 
 *      BALLOTS
 */

    async async_getAvailableBallots(objParam) {
        try {
            const dataAwaitReg = await gConfig.app.apiBallot.async_getPubliclyAvailableBallotsForRegistration();
            const dataAwaitVote = await gConfig.app.apiBallot.async_getPubliclyAvailableBallotsForVoting();
            const dataAvailStats = await gConfig.app.apiBallot.async_getPubliclyAvailableBallotsForStats();

            return {
                data: {
                    aAwaitReg: dataAwaitReg.data,
                    aAwaitVote: dataAwaitVote.data,
                    aAvailStats: dataAvailStats.data
                }
            }
        }
        catch(err) {
            throw err;
        }
    }
}

module.exports = api_user_voter;