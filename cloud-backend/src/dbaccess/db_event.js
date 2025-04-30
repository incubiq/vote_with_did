
const MEvt = require('../models/model').event;
const dbBase = require('./base_dbBase');

/*  -- PUBLIC APIs --

 */

class dbEvent extends dbBase {

    getCacheString(objFind) {
        // no cache
        return null;
    }

    getModel() {
        return MEvt;
    }

    async async_createEvent(obj){
        // min requirement
        if(!obj || !obj.username) {return null}

        if(!obj.type) {obj.type=0}
        obj.created_at=new Date(new Date().toUTCString());
        return this.async_cached_create(obj);
    }
}

module.exports = dbEvent;