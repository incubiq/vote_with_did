const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');

/*   
 *      User / VOTER APIs
 */

class api_user_voter extends apiBase {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

        const classDBVoter = require('../dbaccess/db_voter');
        this.dbVoter=new classDBVoter({stdTTL: 864000});   // 10 day cache...
    }


/*
 *  Public APIs   
 */

}

module.exports = api_user_voter;