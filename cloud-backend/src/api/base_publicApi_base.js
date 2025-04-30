
const Q = require('q');

const classCache = require('../cache/class_cache');

/*
        async_apiToDbCall
 */

class apiBase extends classCache {

    constructor (objParam) {
        super(objParam); // need to call the parent constructor when inheriting
        const classDBEvent = require('../dbaccess/db_event');
        this.dbEvent=new classDBEvent({stdTTL: 864000});   // 10 day cache...
    }

    getDBMgr() {
        return this.dbMgr;
    }

    setDBMgr(dbMgr) {
        this.dbMgr=dbMgr;
    }

    // process the simplest API to DB call in a most efficient way
    async_apiToDbCall(promise){
        var deferred = Q.defer();
        promise
            .then(function (data){
                deferred.resolve({data: data})
            })
            .catch(function(err){
                deferred.reject(err);
            });
        return deferred.promise;
    }

    consoleLog(_msg) {
        if(!_msg) {
            console.log("\r\n");    
        }
        else {
            let _date=new Date(new Date().toUTCString());
            let _strDate=_date.toString();
            console.log(_strDate.substring(0, _strDate.indexOf('GMT'))+ " - "+_msg);    
        }
    }
}

module.exports = apiBase;