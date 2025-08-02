const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const jwt = require('jsonwebtoken');

const cUser=require('../const/const_users');
const cCookie=require('../const/const_cookie');

const classDBWalletType = require('../dbaccess/db_wallet_type');
const dbWalletType=new classDBWalletType({stdTTL: 864000});   // 10 day cache...

// all routes here start with               api/v1/auth/
/*
 *      Public routes
 */

router.post("/", function(req, res, next) {
    const { seed } = req.body;
  
    if (!seed) {
        return res.status(400).json({ error: 'Seed is required' });
    }
        
    // Generate JWT token
    const token = jwt.sign({ 
        username: req.body.username, 
        }, 
        gConfig.jwtKey,
        { expiresIn: gConfig.authentication_expire } 
    );

    cUser.addUser(req.body.username, seed);

    res.cookie(cCookie.getCookieName(), token, {
        httpOnly: false,        // true = Prevents JavaScript access to the cookie
        secure:  gConfig.isDebug? false : true,          // Only sent over HTTPS
        sameSite: 'Lax',    // Prevents CSRF attacks
        maxAge: gConfig.maxAge,     // 72h
    });
    return res.json({ data: {
        token: token }
    });
});

/*
 *      wallet access routes (so that backend knows all wallet types seen client side)
 */

router.post("/wallet", function(req, res, next) {

    const async_ensureWalletType = async(objParam) => {
        try {            
            // exist?
            let objWT=await dbWalletType.async_findWalletType({
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
                objWT=await dbWalletType.async_createWalletType(objWT);
            }
            return objWT;            
        }
        catch(err) {
            throw err;
        }
    }

    routeUtils.apiPost(req, res, async_ensureWalletType, {
        chain: req.body.chain? req.body.chain: null,
        id: req.body.id? req.body.id: null,
        name: req.body.name? req.body.name: null,
        logo: req.body.logo? req.body.logo: null,
        networkId: req.body.networkId? parseInt(req.body.networkId): 0,
    });
});


module.exports = router;
