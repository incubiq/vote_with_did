const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');

/*   
 *      User / VIEWER APIs
 */

class api_user_viewer extends apiBase {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting
    }

/*
 *      PUBLIC API
 */

    async async_getUser(objParam) {
        return {data : [{
            username: "anon",
            isViewer: true,
            isVoter: false,
            isDesigner: false,
            isAdmin: false,
        }]}
    }

    async async_getVotes (objParam) {
        try {
            return gConfig.app.apiBallot.async_collectVotesFromBlockchain(objParam);
        }
        catch (error) {
            throw error;
        }
    }
}

module.exports = api_user_viewer;