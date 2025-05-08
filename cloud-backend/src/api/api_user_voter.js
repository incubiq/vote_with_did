const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');

/*   
 *      User / VOTER APIs
 */

class api_user_voter extends apiBase {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

//        const classDBVoter = require('../dbaccess/db_voter');
//        this.dbVoter=new classDBVoter({stdTTL: 864000});   // 10 day cache...

        const classDBWalletType = require('../dbaccess/db_wallet_type');
        this.dbWalletType=new classDBWalletType({stdTTL: 864000});   // 10 day cache...
    }


/*
 *  Public APIs   
 */

    async async_ensureWalletType(objParam) {
        try {            
            // exist?
            let objWT=await this.dbWalletType.async_findWalletType({
                chain: objParam.chain,
                id: objParam.id,
                deleted_at: null
            });
            
            if(!objWT) {
                // create it
                objWT={
                    chain: objParam.chain,
                    id: objParam.id,
                    networkId: objParam.networkId,
                    name: objParam.name,
                    logo: objParam.logo,
                };
                objWT=await this.dbWalletType.async_createWalletType(objWT);
            }
            return objWT;            
        }
        catch(err) {
            throw err;
        }
    }

}

module.exports = api_user_voter;