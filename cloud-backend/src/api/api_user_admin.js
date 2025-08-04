const jwtDecode = require('jwt-decode');
const crypto = require('crypto');
const {ed25519} = require('@noble/curves/ed25519');

const apiDesigner = require('./api_user_designer');
const utilServices = require('../utils/util_services');
const utilsCreds = require('../utils/util_identus_credentials');
const utilsProof = require('../utils/util_identus_proof');
const utilsIdentity = require('../utils/util_identus_identity');
const utilsConnection = require('../utils/util_identus_connections');
const utilsBlockfrost = require('../utils/util_blockfrost');
const cEvents = require('../const/const_events');
const cUsers = require('../const/const_users');

/*   
 *      User / ADMIN APIs
 */

class api_user_admin extends apiDesigner {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

    }

/*
 *      ADMIN (user)
 */
    
    async async_getUser(objParam) {
        try {
            const dataUser = await this.async_getUserWithDID(objParam)
            return {data : [{
                username: dataUser.data.username,
                did : dataUser.data.did,
                isViewer: true,
                isVoter: true,
                isDesigner: true,
                isAdmin: true,
                canAddQuestion: true,
                canCreateBallot: true,
                canEditBallot: true,
                canPublishBallot: true,
            }]}
        }
        catch(err) {
            throw err;
        }
    }

/*
 *      Ballot creation
 */

    async async_createBallot(objParam) {
        try {
            if(!objParam.canCreateBallot){
                 throw {
                        data: null,
                        status: 403,
                        statusText: "Insufficient credentials to create a ballot"
                    }
            }

            const dataBallot = await gConfig.app.apiBallot.async_createBallot({
                did: objParam.did,
                name: objParam.name
            });

            return dataBallot;
        }
        catch(err) {
            throw err;
        }
    }

    // get ballot UID of an admin 
    async async_findMyBallot(objParam) {
        try {
            return gConfig.app.apiBallot.async_findMyBallot(objParam);
        }
        catch(err) {
            throw err;
        }
    }

    // get ALL ballots of an admin 
    async async_getMyBallots(objParam) {
        try {
            return gConfig.app.apiBallot.async_getMyBallots(objParam);
        }
        catch(err) {
            throw err;
        }
    }
    
    getUniqueBallotKeys(objParam) {
        const keyUser=cUsers.getUser(objParam.username);
        const info = `ballot:${objParam.uid_ballot}:${objParam.published_at}`;
        const hmac = crypto.createHmac('sha256', keyUser);
        hmac.update(info);
        const seed = hmac.digest();
        const priv = seedBallot.slice(0, 32);
        return {
            private: priv,
            public: ed25519.getPublicKey(priv)
        };
    }

    // an admin publishes his ballot
    async async_publishBallot(objFind, objUpd) {
        try {
            const keyUser=cUsers.getUser(objFind.username);

            const dataPublished=await gConfig.app.apiBallot.async_publishBallot({
                uid: objFind.uid,
                did: objFind.did
            }, objUpd);

            const ballotKeys=this.getUniqueBallotSeed({
                username: objFind.username,
                uid_ballot: objFind.uid,
                published_at: dataPublished.data.published_at
            })

            // now create a DID with those keys, and set the services
            const pubBallot = await async_createAndPublishDidForBallot({
                title: dataPublished.data.title,
                closingRegistration_at: dataPublished.data.closingRegistration_at,
                closingVote_at: dataPublished.data.closingVote_at,
                openingRegistration_at: dataPublished.data.openingRegistration_at,
                openingVote_at: dataPublished.data.openingVote_at,
                aQ: [],
                aReq: dataPublished.data.aCreds
            }) 


        }
        catch(err) {
            throw err;
        }
    }

}

module.exports = api_user_admin;