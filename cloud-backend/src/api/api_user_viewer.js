const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');

/*   
 *      User / VIEVER APIs
 */

class api_user_viewer extends apiBase {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

        const classDBViewer = require('../dbaccess/db_viewer');
        this.dbViewer=new classDBViewer({stdTTL: 864000});   // 10 day cache...
    }


/*
 *  Public APIs   
 */

}

module.exports = api_user_viewer;