
const MBallot = require('../models/model').ballot;
const dbBase = require('./base_dbBase');

/*  -- PUBLIC APIs --

 */

class dbBallot extends dbBase {

    getCacheString(objFind) {
        if (!objFind.uid) {
            return null;
        }
        return "ballot_"+objFind.uid;
    }

    getModel() {
        return MBallot;
    }

    async async_createBallot(obj){
        // min requirement
        if(!obj || !obj.did_admin || !obj.name) {return null}

        obj.created_at=new Date(new Date().toUTCString());
        objCreate.uid=this.generateUid();
        return this.async_cached_create(obj);
    }

    async async_updateBallot(objFind, objUpdate) {
        objUpdate.updated_at=new Date(new Date().toUTCString());

        // todo : log history of changes 

        return this.async_cached_update(objFind, objUpdate);
    }

    async async_findBallot(objFind) {     
        return this.async_cached_findOne(objFind);
    }

    async async_getBallots(objFind, objFilter, aAggregate) {
        if(!aAggregate) {
            aAggregate=[];
        }
        // remove soft deleted from result
        aAggregate.push({
            "$match": {
                deleted_at: {"$eq" : null}
            }
        });

        try {
            let _aRet=await this.async_findAll(objFind, objFilter, aAggregate);
            return _aRet
        }
        catch(err) {
            throw err;
        }
    }    
}

module.exports = dbBallot;