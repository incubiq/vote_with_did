
const MBallot = require('../models/model').question;
const dbBase = require('./base_dbBase');

/*  -- PUBLIC APIs --

 */

class dbQuestion extends dbBase {

    getCacheString(objFind) {
        if (!objFind.uid) {
            return null;
        }
        return "question_"+objFind.uid;
    }

    getModel() {
        return MBallot;
    }

    async async_createQ(obj){
        // min requirement
        if(!obj || !obj.type || !obj.title) {return null}

        obj.created_at=new Date(new Date().toUTCString());
        obj.uid=this.generateUid();
        return this.async_cached_create(obj);
    }

    async async_updateQ(objFind, objUpdate) {
        objUpdate.updated_at=new Date(new Date().toUTCString());

        return this.async_cached_update(objFind, objUpdate);
    }

    async async_findQ(objFind) {     
        return this.async_cached_findOne(objFind);
    }

    async async_getQuestions(objFind, objFilter, aAggregate) {
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

    async async_deleteQ(obj){
        return this.async_cached_delete(obj);
    }

}

module.exports = dbQuestion;