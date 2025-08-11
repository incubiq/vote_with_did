const jwtDecode = require('jwt-decode');

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

    adminSign(data, adminKey) {
        // Create HMAC signature using admin's master key
        const hmac = crypto.createHmac('sha512', adminKey);
        hmac.update(data);
        return hmac.digest('hex');
    }

    verifyAdminSignature(signature, data, adminKey) {
        const expectedSignature = adminSign(data, adminKey);
        return signature === expectedSignature;
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
    
    // an admin publishes his ballot
    async async_publishBallot(objFind, objUpd) {
        try {
            if(objFind.canPublishBallot!==true) {
                throw {
                    data: null,
                    status: 403,
                    statusText: "Insufficient credentials to publish this ballot"
                }
            }

            // we publish the ballot
            const dataPublished=await gConfig.app.apiBallot.async_publishBallot({
                uid: objFind.uid,
                did: objFind.did
            }, objUpd);
            
            return dataPublished;

        }
        catch(err) {
            throw err;
        }
    }

    async async_tallyBallot(objFind) {
        try {
            if(objFind.canPublishBallot!==true) {
                throw {
                    data: null,
                    status: 403,
                    statusText: "Insufficient credentials to compute ballot results"
                }
            }
            const dataBallot=await gConfig.app.apiBallot.async_findMyBallot({
                uid: objFind.uid,
                did: objFind.did
            });

            const dataTally = await gConfig.app.apiBallot.async_tallyVote(objFind);

            return dataTally;

        }
        catch(err) {
            throw err;
        }

    }

}

module.exports = api_user_admin;