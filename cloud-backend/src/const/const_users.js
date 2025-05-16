const identusIdentity = require('../utils/util_identus_identity');

const aUser=[];

const addUser = (_username, _seed) =>  {
    const iUser = aUser.findIndex(function (x) {return x.username===_username});
    if(iUser==-1) {
        aUser.push({
            username: _username,
            seed: _seed
        });
    }
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
    checkUser,
}