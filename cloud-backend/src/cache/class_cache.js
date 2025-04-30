
const Q = require("q");
const _ = require('lodash');
const NodeCache = require( "node-cache" );
const cCacheVersion=parseInt(NodeCache.version.substr(0,1));

/*

    getCacheString
    async_getDataFromCache
    updateCache
    deleteCache

 */

class Cache {

    constructor(objParam) {
        var objCache={stdTTL: 864000};      // 10 day cache by default
        if(objParam && objParam.stdTTL) {
            objCache.stdTTL=objParam.stdTTL;
        }
        this.myCache=new NodeCache(objCache);
    }

/*
 * CACHE
 */

    getCacheString(objFind) {
        return null;
    }

    updateCache(objFind, data){
        var strCache = this.getCacheString(objFind);
        if(strCache)
            this.myCache.set(strCache, data);
    }

    deleteCache(objFind){
        var strCache = this.getCacheString(objFind);
        if(strCache)
            this.myCache.del(strCache);
    }

    deleteAllKeyWithText(match){

        // delete all cache for this id_site
        var that=this;
        this.myCache.keys(function(err, aKey){
            var aItem=[];
            aKey.forEach(function(item){
                if(item.indexOf(match)!=-1)
                    aItem.push(item);
            });
            if(aItem.length>0) {
                that.deleteCache(aItem);
            }
        });
    }

    reset() {
        this.myCache.flushAll();
    }

    async_getDataFromCache(objFind){
        var deferred = Q.defer();
        var strCache = this.getCacheString(objFind);

        if(strCache) {
            if(cCacheVersion > 4) {
                deferred.resolve(this.myCache.get(strCache));
            }
            else {
                this.myCache.get(strCache, function (err, cachedData) {
                    deferred.resolve(cachedData);
                });
            }
        }
        else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }
    
    // error mgt
    StatusError(objError) {

        function _StatusError(objError) {
            this.status = objError.status;
            this.message = objError.statusText? objError.statusText : objError.message;
            this.data= objError.data;
        }
        _StatusError.prototype = Error.prototype;

        var e = new _StatusError(objError);
        console.log(e.status + " - " + e.message);
        throw e;
    }
}

module.exports = Cache;
