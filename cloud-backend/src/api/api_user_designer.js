const jwtDecode = require('jwt-decode');
const apiVoter = require('./api_user_voter');
const utilServices = require('../utils/util_services');
const utilsCreds = require('../utils/util_identus_credentials');
const utilsProof = require('../utils/util_identus_proof');
const utilsIdentity = require('../utils/util_identus_identity');
const utilsConnection = require('../utils/util_identus_connections');
const utilsBlockfrost = require('../utils/util_blockfrost');
const cEvents = require('../const/const_events');
const cUsers = require('../const/const_users');

/*   
 *      User / DESIGNER APIs
 */

class api_user_designer extends apiVoter {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

    }

/*
 *  
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
                isAdmin: false,
                canAddQuestion: true,
                canCreateBallot: false,
                canEditBallot: false,
                canPublishBallot: false,
            }]}
        }
        catch(err) {
            throw err;
        }
    }

/*
 *      Ballot Updates
 */
    
    // add question
    async async_addQuestion(objParam, objQuestion) {
        try {

            // create a question 
            const dataQ = gConfig.app.apiBallot.async_createQuestion({
                type: objQuestion.type,
                title: objQuestion.title
            })

            return gConfig.app.apiBallot.async_addQuestion({
                canAddQuestion: true,
                uid_ballot: objParam.uid,
                uid_question: dataQ.data.uid,
                did: objParam.did
            });

        }
        catch(err) {
            throw err;
        }
    }

}

module.exports = api_user_designer;