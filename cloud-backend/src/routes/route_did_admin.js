
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/admin/

/*
 *      Admin route for Identus
 */

// get authenticated admin details
router.get("/", function(req, res, next) {
  routeUtils.apiGet(req, res, identusUtils.async_getAdminStatus, {});
});


/*
 *      entity routes
 */

// GET /entities
router.get("/entities", function(req, res, next) {
  routeUtils.apiGet(req, res, srvIdentus.async_getEntities, {
    offset: req.query.offset? parseInt(req.query.offset) : 0,           // offset for pagination 
    limit: req.query.limit? parseInt(req.query.limit) : 100,           // limit for pagination
  });
});

// GET /entity
router.get("/entity/:entity", function(req, res, next) {
  routeUtils.apiGet(req, res, srvIdentus.async_getEntityById, {
    entity:  req.params.entity? req.params.entity : null,           // id of entity to get
  });
});

// POST /entity  (will create entity, wallet, auth key, and auth DID) ; note: a caller role will create a new wallet whereas any other role expects 
router.post("/entity", function(req, res, next) {
    routeUtils.apiPost(req, res, srvIdentus.async_createEntityWithAuth, {
        name:  req.body && req.body.name? req.body.name : null,                   // a name for this wallet & entity
        role:  req.body && req.body.role? req.body.role : null,                   // a role for this entity (caller, worker, provider, admin) 
        mnemonic:  req.body.mnemonic? req.body.mnemonic : null,       // a seed phrase (optional ; if not provided, the API will generate a random one)
        id_wallet: req.body.id_wallet? req.body.id_wallet : null      // id of the existing wallet (then we do not use mnemonic) 
    });
  });

 // DEL /entity
router.delete("/entity/:entity", function(req, res, next) {
  routeUtils.apiDelete(req, res, srvIdentus.async_deleteEntityById, {
    entity:  req.params.entity? req.params.entity : null,           // id of entity to delete
  });
});

/*
 *      wallets routes
 */

// GET /wallets
router.get("/wallets", function(req, res, next) {
  routeUtils.apiGet(req, res, srvIdentus.async_getWallets, {
    offset: req.query.offset? parseInt(req.query.offset) : 0,           // offset for pagination 
    limit: req.query.limit? parseInt(req.query.limit) : 100,           // limit for pagination
  });
});

module.exports = router;
