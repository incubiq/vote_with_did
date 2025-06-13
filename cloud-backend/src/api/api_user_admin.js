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
const { connection } = require('mongoose');

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
            if(!canCreateBallot){
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

    async async_updateBallotRules(objParam, objUpdate) {
        try {
            return gConfig.app.apiBallot.async_updateBallotByAdmin({
                uid: objParam.uid,
                did: objParam.did
            }, 
            objUpdate);
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
    async async_publishBallot(objParam) {
        try {
            return gConfig.app.apiBallot.async_publishBallot({
                uid: objParam.uid,
                did: objParam.did
            })
        }
        catch(err) {
            throw err;
        }
    }

}

module.exports = api_user_admin;