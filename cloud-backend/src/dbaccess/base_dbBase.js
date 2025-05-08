
const mongoose = require('mongoose');
const Q = require("q");
const _ = require('lodash');

const classCache = require('../cache/class_cache');

/*
 *      formatObject(obj)
 *      getCacheString(objFind)
 *
 *      async_findAll(objFind, objFilter, aObjAggregate)
 *      async_findOne(objFind, aObjAggregate)
 *      async_findById(id)
 *      async_create(objCreate)
 *      async_findOrCreate(objFind, objCreate)
 *      async_update(objFind, objUpdate)
 *      async_updateOrCreate(objFind, objCreate, objUpdate)
 *      async_findOneAndDelete(objFind)
 *
 *      async_cached_create(objCreate)
 *      async_cached_findOrCreate(objFind, objCreate)
 *      async_cached_update(objFind, objUpdate)
 *      async_cached_updateOrCreate(objFind, objCreate, objUpdate)
 *      async_cached_delete(objFind)
 *
 */

class dbBase extends classCache {

/*
 * PRIVATE
 */

    _getDBFilters(objFilter) {

        // make sure we do not end up with empty field...
        if(!objFilter)
            objFilter={};
        if(!objFilter.hasOwnProperty("filterPaging"))
            objFilter.filterPaging={};
        if(!objFilter.hasOwnProperty("filterSort"))
            objFilter.filterSort={};
        if(!objFilter.hasOwnProperty("filterDateRange"))
            objFilter.filterDateRange={};

        var objSort={};
        var objRet={
            limit: objFilter.filterPaging.limit ? objFilter.filterPaging.limit : 20,
            offset: objFilter.filterPaging.offset ? objFilter.filterPaging.offset : 0,
            sortby: objFilter.filterSort.sortby ? objFilter.filterSort.sortby : "_id",
            sortDirection: objFilter.filterSort.sortDirection ? objFilter.filterSort.sortDirection : -1,
            objSort: {},
            findRange: null
        };

        objRet.objSort[objRet.sortby]= objRet.sortDirection;

        if(objFilter.hasOwnProperty("filterDateRange") && objFilter.filterDateRange.filterDateBy!=null && objFilter.filterDateRange.filterDateBy!="") {
            objRet.findRange={
                filterDateBy: objFilter.filterDateRange.filterDateBy,
                filterObject: (objFilter.filterDateRange.dateFrom!=null && objFilter.filterDateRange.dateTo!=null) ? {"$gte": objFilter.filterDateRange.dateFrom, "$lte": objFilter.filterDateRange.dateTo} :
                    (objFilter.filterDateRange.dateFrom!=null) ? {"$gte": objFilter.filterDateRange.dateFrom} :
                        (objFilter.filterDateRange.dateTo!=null) ? {"$lte": objFilter.filterDateRange.dateTo} : null
            };
        }
        return objRet;
    }

    _getFinalAggregate(objFind, objFilter, aObjAggregate) {
        var aRet=[];

        // create a aAggregByProp to facilitate next phase
        if(!aObjAggregate)
            aObjAggregate=[];
        var aAggregByProp=[];

        var _getIndexOfAggreg=function(propName){
            for (var i=0; i<aObjAggregate.length; i++) {
                if(Object.keys(aObjAggregate[i])[0]==propName)
                    return i;
            }
            return -1;
        };

        // aggregate gets default filters in
        var filters=this._getDBFilters(objFilter);

        // no sort property set?? we add one LAST of array
        var iSort=_getIndexOfAggreg("$sort");
        if(iSort==-1) {
            if(filters.objSort)
                aObjAggregate.push({"$sort" :filters.objSort});
            else
                aObjAggregate.push({"$sort": {_id:-1}});
        }

        // no limit yet?? we add one at back of array (keep at back just before Sort because we may limit on something else than initial match)
        var iLimit=_getIndexOfAggreg("$limit");
        if(iLimit==-1) {
            if(filters.limit)
                aObjAggregate.push({"$limit": filters.limit});
            else
                aObjAggregate.push({"$limit": 20});
        }

        //deal with date range
        if(filters.findRange) {
            var objFilterDate={};
            objFilterDate[filters.findRange.filterDateBy]=filters.findRange.filterObject;
            aObjAggregate.unshift({"$match": objFilterDate});   // put this filtering at the start of the requests (just before the first match)...
        }

        // first in (match)
        aRet.unshift({$match: objFind});

        aObjAggregate.forEach(function (item) {
            aRet.push(item);
        });
        return aRet;
    }

/*
 * OVERLOADS
 */

    getModel() {
        return null;        // must overload...
    }

    formatObject(obj) {
        if (obj) {
            delete obj._id;
            delete obj.__v;
            return obj;
        }
        return null;
    }

    getCacheString(objFind) {
        return null; // compulsory implement in above classes....
    }
    
/*
 * PUBLIC
 */

    generateUid() {
        return new Date().getTime();
    }

    async_findAll_fromModel(model, objFind, objFilter, aObjAggregate) {
        var deferred = Q.defer();
        var that=this;
        model.aggregate(this._getFinalAggregate(objFind, objFilter, aObjAggregate))
            .then(function(aData){
                var aFormattedData=[];
                aData.forEach(function(item){
                    aFormattedData.push(that.formatObject(item));
                });
                deferred.resolve(aFormattedData);
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_findAll(objFind, objFilter, aObjAggregate) {
        return this.async_findAll_fromModel(this.getModel(), objFind, objFilter, aObjAggregate);
    }

    async_findOne(objFind, aObjAggregate) {
        var deferred = Q.defer();
        var model=this.getModel();
        var that=this;
        model.aggregate(this._getFinalAggregate(objFind, {}, aObjAggregate))
            .then(function(aData){
                if(aData && aData.length>0)
                    deferred.resolve(that.formatObject(aData[0]));
                else
                    deferred.resolve(null);
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_cached_findOne(objFind, aObjAggregate) {
        let deferred = Q.defer();
        var that=this;

        this.async_getDataFromCache(objFind)
            .then(function(cachedData){
                if (!cachedData) {
                    // Pass request onto the db
                    that.async_findOne(objFind, [])
                        .then(function(objFound){
                            that.updateCache(objFind, objFound);
                            deferred.resolve(objFound);
                        })
                        .catch(function(err){
                            deferred.reject(err);
                        });
                } else {
                    deferred.resolve(cachedData);
                }
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_findById(id) {
        var deferred = Q.defer();
        var model=this.getModel();
        var that=this;
        model.findById( mongoose.Types.ObjectId(id), function (err, mgDoc) {
            if(!err && mgDoc) {
                deferred.resolve(that.formatObject(mgDoc._doc));
            }
            else {
                deferred.resolve(null);
            }
        });
        return deferred.promise;
    }

    async async_create(objCreate) {
        try {
            var model=this.getModel();
            var mgDoc = new model(objCreate);
            await mgDoc.save();
            return this.formatObject(mgDoc._doc);
        }
        catch (err) {
            throw {
                data: null,
                status: 406,
                statusText: err.message || "Object could not be created"
            };
        }
    }

    async_cached_create(objCreate) {
        var deferred = Q.defer();
        var model=this.getModel();
        var that=this;

        this.async_create(objCreate)
            .then(function(objRet){
                that.updateCache(objCreate, objRet);
                deferred.resolve(that.formatObject(objRet));
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_findOrCreate(objFind, objCreate) {
        var deferred = Q.defer();
        var that=this;
        this.async_findOne(objFind, [])
            .then(function(obj){
                if(!obj) {
                    that.async_create(objCreate)
                        .then(function(objCreated){
                            deferred.resolve(that.formatObject(objCreated));
                        })
                        .catch(function(err){
                            deferred.reject(err);
                        });

                }
                else {
                    deferred.resolve(that.formatObject(obj));
                }
            })
            .catch(function(err){
                deferred.reject(err);
            });
        return deferred.promise;
    }


    async_cached_findOrCreate(objFind, objCreate){
        var deferred = Q.defer();
        var that=this;
        this.async_getDataFromCache(objFind)
            .then(function (cachedData) {
                if (!cachedData) {
                    that.async_findOrCreate(objFind, objCreate)
                        .then(function(objRet){
                            that.updateCache(objFind, objRet);
                            deferred.resolve(that.formatObject(objRet));
                        })
                        .catch(function(err){
                            deferred.reject(err);
                        });
                }
                else {
                    deferred.resolve(that.formatObject(cachedData));
                }
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_update(objFind, objUpdate) {
        var deferred = Q.defer();
        var model=this.getModel();
        var that=this;
        model.findOneAndUpdate(objFind, objUpdate, {upsert: true, new: true})       // keep these options or hell breaks everywhere!
            .then(function(mgDoc){
                if(!mgDoc) {
                    deferred.resolve(null);
                }
                else {
                    deferred.resolve(that.formatObject(mgDoc._doc));
                }
            })
            .catch(function(err){
                deferred.reject(err);
            });
        return deferred.promise;
    }

    async_cached_update(objFind, objUpdate) {
        var deferred = Q.defer();
        var that=this;

        // remove user from the cache.... we ll get it back next time
        this.deleteCache(objFind);
        this.async_update(objFind, objUpdate)
            .then(function(objRet){
                that.updateCache(objFind, objRet);
                deferred.resolve(that.formatObject(objRet));
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_updateOrCreate(objFind, objCreate, objUpdate) {
        var deferred = Q.defer();
        var model=this.getModel();
        var that=this;
        model.findOne(objFind)
            .then(function(mgDoc){
                if(!mgDoc) {
                    that.async_create(objCreate)
                        .then(function (objRet){
                            deferred.resolve(that.formatObject(objRet));
                        })
                        .catch(function (err){
                            deferred.reject(err);
                        });
                }
                else {
                    if(!_.isEmpty(objUpdate)) {
                        that.async_update(objFind, objUpdate)         // todo : could probably do a save() on the doc and avoid one more search to DB...? maybe not worth the hassle
                            .then(function(obj){
                                deferred.resolve(that.formatObject(obj));
                            })
                            .catch(function(err){
                                deferred.reject(err);
                            });
                    } else {
                        deferred.resolve(that.formatObject(mgDoc._doc));
                    }
                }
            })
            .catch(function(err){
                deferred.reject(err);
            });
        return deferred.promise;
    }

    async_cached_updateOrCreate(objFind, objCreate, objUpdate) {
        var deferred = Q.defer();
        var that=this;

        this.deleteCache(objFind);      // delete the cache as we need to update or create, cache will be recreated after the call
        this.async_updateOrCreate(objFind, objCreate, objUpdate)
            .then(function(objRet){
                that.updateCache(objFind, objRet);
                deferred.resolve(that.formatObject(objRet));
            })
            .catch(function(err){
                deferred.reject(err);
            });

        return deferred.promise;
    }

    async_findOneAndDelete(objFind) {
        var deferred = Q.defer();
        var model=this.getModel();
        this.async_findOne(objFind, [])
            .then(function(objFound){
                if(objFound) {
                    model.findOneAndDelete(objFind)
                        .then(function(mgDoc){
                            deferred.resolve(null);
                        })
                        .catch(function(err){
                            deferred.reject(err);
                        });
                }
                else {
                    deferred.reject({
                        data: null,
                        status: 404,
                        statusText: "Could not find object"
                    });
                }
                deferred.resolve(null);
            })
            .catch(function(err){
                deferred.reject(err);
            });
        return deferred.promise;
    }

    async_cached_delete(objFind) {
        this.deleteCache(objFind);
        return this.async_findOneAndDelete(objFind);
    }

}

module.exports = dbBase;
