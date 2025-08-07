
/*
 *       Calls to Identus / Atala Prism agent 
 */

const srvCardano = require("./util_cardano");
const isEqual = require ("lodash/isEqual");
const srvIdentusUtils = require("./util_identus_utils");
const crypto = require('crypto');
const HASH_ALGORITHM = "sha256"; // NOTE: must match the algorithm in api auth2admin

const DID_PURPOSE_AUTH = "authentication"
const DID_PURPOSE_ISSUANCE = "issue"

/*
 *       Entity + wallet
 */

const async_getEntities = async function (objParam){
    try {
        let resp = await srvIdentusUtils.async_simpleGet("iam/entities?offset="+objParam?.offset+"&limit="+objParam?.limit, null);
        if(resp.data) {
            return {
                data: resp.data
            }
        }
    }
    catch(err)  {
        throw err;
    }
}

const async_getEntityById = async function (objEntity){
    try {
        let resp = await srvIdentusUtils.async_simpleGet("iam/entities/"+objEntity.entity, null);
        if(resp.data) {
            return {
                data: resp.data
            }
        }
    }
    catch(err)  {
        throw {
            data: null,
            status: 404,
            statusText: "Not found"
        };
    }
}

const async_getWallets = async function (objParam) {
    try {
        let resp = await srvIdentusUtils.async_simpleGet("wallets?offset="+objParam.offset+"&limit="+objParam.limit, null);
        if(resp.data) {
            return {
                data: resp.data
            }
        }
    }
    catch(err)  {
        throw err;
    }
}

const async_findOrCreateIdentityWallet = async function (objParam){
    try {
        // does the wallet exist?
        try {
            if(objParam.id_wallet==null) {throw null}
            let responseW = await srvIdentusUtils.async_simpleGet("wallets/"+objParam.id_wallet, null);
            if(responseW.data.id) {
                return {
                    data: responseW.data
                }
            }
            else {throw null}       // id was set by default creation, first call, wallet does not exist yet
        }
        catch(err)  {
            // create Identity wallet
            return srvIdentusUtils.async_simplePost("wallets/", null, {
                id: objParam.id_wallet,   
                seed: objParam.seed,
                name: objParam.name
            });
        }
    
    }    
    catch(err)  {
        throw err;
    }
}

const async_findOrCreateEntity = async function (objParam) {
    try {
        // does the entity exist?
        try {
            if(objParam.id_entity==null) {throw null}
            let responseE = await srvIdentusUtils.async_simpleGet("iam/entities/"+objParam.id_entity, null);
            if(responseE.data.id) {
                return {
                    data: responseE.data
                }
            }
            else {throw null}       // id was set by default creation, first call, wallet does not exist yet
        }
        catch(err)  {
            // create entity
            const dataE = await srvIdentusUtils.async_simplePost("iam/entities/", null, {
                id: objParam.id_entity,               // id of the entity (UUID)
                name: objParam.name + " ("+objParam.role+")",
                walletId: objParam.id_wallet
            });

            // register auth key
            await srvIdentusUtils.async_simplePost("iam/apikey-authentication/", null, {
                entityId: dataE.data.id,
                apiKey: objParam.key,
            });

            return dataE;
        }
    
    }    
    catch(err)  {
        throw err;
    }
}

const _generateUUIDFromSeed = function(_seed) {
    // Hash the seed using SHA-256
    const hash = crypto.createHash('sha256').update(_seed).digest('hex');
  
    // Take the first 32 characters of the hash
    const part1 = hash.substring(0, 8);
    const part2 = hash.substring(8, 12);
    const part3 = hash.substring(12, 16);
    const part4 = hash.substring(16, 20);
    const part5 = hash.substring(20, 32);
  
    // Format as UUID
    const uuid = `${part1}-${part2}-${part3}-${part4}-${part5}`;
    return uuid;
}

const getIdentusIdsFromSeed = function (_seed) {
    return {
        id_wallet: _generateUUIDFromSeed(_seed),
        id_entity: _generateUUIDFromSeed(_seed+1),
        key: _generateUUIDFromSeed(_seed+2),
    }
}

const async_createEntityWithAuthForRole = async function (objParam){
    try {
        // get Cardano wallet keys... 
        const objKeys=await srvCardano.getWalletDetails({
            mnemonic: objParam.mnemonic? objParam.mnemonic : null,      // will use either this one 
            seed: objParam.seed? objParam.seed : null                   // or this one (if no mnemonic)
        });  
        const objIDs=getIdentusIdsFromSeed(objKeys.data.seed);
        
        // create Identity wallet  / or find existing one
        let responseW = await async_findOrCreateIdentityWallet({
            id_wallet: objIDs.id_wallet,            // optional (to seach if exist, otherwise we create)
            seed: objKeys.data.seed,
            name: objParam.name
        }, {
            headers: srvIdentusUtils.getAdminHeader()
        });
        
        // we have a wallet (new or old), now create entity for the role 
        let responseE = await async_findOrCreateEntity({
            id_entity: objIDs.id_entity,
            id_wallet: responseW.data.id,
            name: objParam.name,
            role: objParam.role,
            key: objIDs.key,
        })

        // we create a did for Auth
        let dataDID = await async_createAndPublishDid({
            canAuth: objParam.canAuth==true,
            canIssue: objParam.canIssue==true,
            services: objParam.services? objParam.services: [],
            key: objIDs.key
        })

        // return important info
        return {
            data: {
                id_entity: responseE.data.id,      // id of the entity
                id_wallet: responseW.data.id,      // id of the wallet
                name: objParam.name,        // name of the wallet ; entity will have (<role>) appended to the name
                role: objParam.role,        // role of this entity
                created_at: new Date(responseE.data.createdAt), // date of creation of the entity
                key: objIDs.key,                   // auth key of the entity
                public_addr: objKeys.data.addr,     // public address of the wallet used by this entity
                didAuth: dataDID ? dataDID.data.did : null,     // DID for authenticating this entity into Identus
                longDid: dataDID ? dataDID.data.longDid: null
            }
        };    
    }    
    catch(err)  {
        throw err;
    }
}

const async_createEntityWithAuth = async function (objParam){
    try {
        // make a random double long seed for this entity
        let mnemonic=objParam.mnemonic;
        if(!mnemonic && !objParam.seed) {
            mnemonic = (await srvCardano.generateSeedPhrase()).data.mnemonic;
        }

        let dataRet = await async_createEntityWithAuthForRole({
            mnemonic: mnemonic? mnemonic: null,                 // case new wallet
            seed: objParam.seed? objParam.seed: null,                 // case new wallet
            name: objParam.name,
            role: objParam.role,
            canAuth: true,
            canIssue: objParam.canIssue==true,
            services: objParam.services? objParam.services: []
        })
        
        return dataRet;    
    }
    catch(err)  {
        throw err;
    }
}

// note : objparam.id (a short string...) is required if publishing other than the first authentication related DID
const async_createAndPublishDid = async function (objParam){
    try {

        // check similarity of service (but remove id (which changes after Doc creation/publication))
        const _isSimilar = (_a, _b) => {
            if (_a.length!=_b.length) {return false}
            if (_a.length==0 && _b.length==0) {return true}
            const  _dupA= JSON.parse(JSON.stringify(_a));
            const  _dupB= JSON.parse(JSON.stringify(_b));
            for (var i=0; i<_dupA.length; i++) {
                delete _dupA[i].id;
                delete _dupB[i].id;
                if(JSON.stringify(_dupA[i])!=JSON.stringify(_dupB[i])) {return false}
            }
            return true;
        }

        // did exist??
        let responseDid = await srvIdentusUtils.async_simpleGet("did-registrar/dids/", objParam.key);
        if(responseDid.data && responseDid.data.length>0) {
            // loop all DIDs and checkl if one matches our requested one
            for (var i=0; i<responseDid.data.length ; i++) {
                const did=responseDid.data[i].did;
                const longFormDid=responseDid.data[i].longFormDid;
                const status=responseDid.data[i].status;

                switch(status) {
                    case "PUBLISHED":
                        // get detasils to check if it s this one
                        let thisDid = await srvIdentusUtils.async_simpleGet("dids/"+did, objParam.key);
                        if(thisDid?.data?.didDocument?.service) {
                            // we have a proper did, but is it this one (does it include our services)?
                            if(_isSimilar(thisDid.data.didDocument.service, objParam.services)) {
                                return {
                                    data: {
                                        did: did,
                                        longDid: null,
                                        wasPublished: true
                                    }
                                }
                            }
                        }                    
                        break;

                    case "CREATED": 
                        // get detasils to check if it s this one
                        let thisLongDid = await srvIdentusUtils.async_simpleGet("dids/"+longFormDid, objParam.key);
                        if(thisLongDid?.data?.didDocument?.service) {
                            // we have a proper did, but is it this one (does it include our services)?
                            if(_isSimilar(thisLongDid.data.didDocument.service, objParam.services)) {
                                // publish it but do not await 
                                srvIdentusUtils.async_simplePost("did-registrar/dids/"+longFormDid+"/publications", objParam.key, {})
                                return {
                                    data: {
                                        did: null,
                                        longDid: longFormDid,
                                        wasPublished: true
                                    }
                                }
                            }
                        }                    
                        break;

                    default: 
                        break;
                }
            }
        }

        // keys
        let aKey=[{
                "id": objParam.id? objParam.id : "key-auth",          // this field has severe undocumented length restriction 
                "purpose": "authentication" 
        }];
        if(objParam.canIssue) {
            aKey.push({
                "id": "key-issue",          // this field has severe undocumented length restriction 
                "purpose": "assertionMethod" 
            })
        }

        // services 

        // create did
        let doc={"documentTemplate": {
            "publicKeys": aKey,
            "services": objParam.services? objParam.services: []
          }
        };

        responseDid = await srvIdentusUtils.async_simplePost("did-registrar/dids/", objParam.key, doc)

        // now publish
        let responsePub = await srvIdentusUtils.async_simplePost("did-registrar/dids/"+responseDid.data.longFormDid+"/publications", objParam.key, {})

        return {
            data: {
                did: null,
                longDid: responseDid.data.longFormDid,
                wasPublished: true
            }
        }
    }
    catch(err)  {
        throw err;
    }
}

// mainly for adding issuance capability to a DID
const async_updateAndPublishDid = async function (objFind, objUpdate) {
    try {
        // update did
        let doc={"actions": [
            {
                "actionType": "ADD_KEY",
                "addKey": {
                  "id": objUpdate.id? objUpdate.id : "issue-2",
                   "purpose": objUpdate.purpose === DID_PURPOSE_AUTH? "authentication" : objUpdate.purpose === DID_PURPOSE_ISSUANCE? "assertionMethod" : "unknown"
                }
            }
        ]}

        // now update
        let responseDid = await srvIdentusUtils.async_simplePost("did-registrar/dids/"+objFind.did+"/updates", objUpdate.key, doc)

        return {
            data: {
                did: objFind.did,
                wasUpdated: true
            }
        }
    }
    catch(err)  {
        throw err;
    }
}

const async_getDidForEntity = async function (objParam){
    try {
        if(objParam.did) {
            return srvIdentusUtils.async_simpleGet("dids/"+objParam.did, null);
        }
        return srvIdentusUtils.async_simpleGet("did-registrar/dids/", objParam.key);
    }
    catch(err)  {
        throw err;
    }
}

const async_deleteEntityById = async function (objParam){
    try {
        return srvIdentusUtils.async_simpleDelete("iam/entities/"+objParam.entity, null);
    }
    catch(err)  {
        throw err;
    }
}

module.exports = {
    DID_PURPOSE_AUTH, 
    DID_PURPOSE_ISSUANCE,

    getIdentusIdsFromSeed,
    async_getEntities,
    async_getEntityById,
    async_getWallets,
    async_createEntityWithAuth,
    async_createAndPublishDid,
    async_updateAndPublishDid,
    async_getDidForEntity,
    async_deleteEntityById,
}