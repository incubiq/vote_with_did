
const MWalletType = require('../models/model').wallet_type;
const dbBase = require('./base_dbBase');

/*  -- PUBLIC APIs --

 */

class dbWalletType extends dbBase {

    getCacheString(objFind) {
        if (!objFind.uid) {
            return null;
        }
        return "wallet_type_"+objFind.chain+"_"+objFind.id;
    }

    getModel() {
        return MWalletType;
    }

    async async_createWalletType(obj){
        // min requirement  
        if(!obj || !obj.chain || !obj.name || !obj.id) {return null}

        obj.created_at=new Date(new Date().toUTCString());
        return this.async_cached_create(obj);
    }

    async async_updateWalletType(objFind, objUpdate) {
        return this.async_cached_update(objFind, objUpdate);
    }

    async async_findWalletType(objFind) {     
        return this.async_cached_findOne(objFind);
    }

    async async_getWalletTypes(objFind, objFilter, aAggregate) {
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

module.exports = dbWalletType;