const identusIdentity = require('../utils/util_identus_identity');

const aUser=[];

const addUser = (_username, _seed) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        aUser.push({
            username: _username,
            seed: _seed,
            did: null,
            dateLock: null,
            aProof: [],

            // user rights
            canCreateBallot: false
        });
    }
}

const addProofToUser = (_username, _proof) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        return null;
    }
    aUser[iUser].aProof.push(_proof);
    return aUser[iUser];
}

const addDidToUser = (_username, _did) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        return null;
    }
    aUser[iUser].did=_did;
    return aUser[iUser];
}

const addAccessRightToUser = (_username, objAccessRight) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        return null;
    }
    for (const prop in objAccessRight) {
        aUser[iUser][prop]=objAccessRight[prop];        
    }
    return aUser[iUser];
}

const addProcessLockToUser = (_username) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        return null;
    }
    aUser[iUser].dateLock=new Date();
    return aUser[iUser];
}

const getUser = (_username) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        return null;
    }
    const objIds=identusIdentity.getIdentusIdsFromSeed(aUser[iUser].seed)
    aUser[iUser].id_wallet = objIds.id_wallet;
    aUser[iUser].id_entity = objIds.id_entity;
    aUser[iUser].key = objIds.key;
    return aUser[iUser];
}

const getUserFromKey = (_key) =>  {
    const iUser = aUser.findIndex(function (x) {return x.key===_key});
    if(iUser==-1) {
        return null;
    }
    return aUser[iUser];
}

const checkUser = (_username, _seed) =>  {
    const user=getUser(_username);
    if(user==null  || user.seed !== _seed) {
        return false;
    }
    return true;
}

module.exports = {
    aUser,
    addUser,
    getUser,
    getUserFromKey,
    checkUser,
    addDidToUser,
    addProofToUser,
    addProcessLockToUser,
    addAccessRightToUser,
}