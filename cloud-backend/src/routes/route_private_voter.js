
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/private/voter/

/*
 *      Private routes (requires login)
 */

router.post("/entity", function(req, res, next) {
      routeUtils.apiPost(req, res, srvIdentus.async_createEntityWithAuth, {
          name:  req.body && req.body.name? req.body.name : null,                   // a name for this wallet & entity
          role:  req.body && req.body.role? req.body.role : null,                   // a role for this entity (caller, worker, provider, admin) 
          mnemonic:  req.body.mnemonic? req.body.mnemonic : null,       // a seed phrase
          id_wallet: null
      });
    });
  
/*
 *      status
 */

// get authenticated voter details
router.get("/", function(req, res, next) {
//    todo
});

// get voter's DID (or generate one if none)
router.get("/did", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiVoter.async_getUserDIDs.bind(gConfig.app.apiVoter), {
    key: req.user && req.user.key? req.user.key: null
  });
});

// get voter's VCs/Proofs 
router.get("/proofs", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiVoter.async_getUserWithProofs.bind(gConfig.app.apiVoter), {
    claim_type: req.query.claim_type? req.query.claim_type: "*",
    key: req.user && req.user.key? req.user.key: null
  });
});


/*
 *      wallet access routes
 */

router.post("/wallet", function(req, res, next) {
   routeUtils.apiPost(req, res, gConfig.app.apiVoter.async_ensureWalletType.bind(gConfig.app.apiVoter), {
        did: req.user && req.user.did? req.user.did: null,
        chain: req.body.chain? req.body.chain: null,
        id: req.body.id? req.body.id: null,
        name: req.body.name? req.body.name: null,
        logo: req.body.logo? req.body.logo: null,
        networkId: req.body.networkId? parseInt(req.body.networkId): 0,
      });
});

router.link("/wallet", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiVoter.async_ensureProofOfOwnership.bind(gConfig.app.apiVoter), {
    address: req.query.address? req.query.address: null,
    chain: req.query.chain? req.query.chain: null,
    networkId: req.query.networkId? parseInt(req.query.networkId): 0,
    claim_type: "address_ownership",
    key: req.user && req.user.key? req.user.key: null
    });
});

/*
 *      voter routes
 */

// Cast a vote on a ballot    !!!! TODO - likely do this via DAPP (not cloud backend)
router.post("/ballot/:uid", function(req, res, next) {
  routeUtils.apiPost(req, res, //todo
  );
});

// get vote history 
router.get("/history", function(req, res, next) {
  routeUtils.apiGet(req, res, //todo
  );
});

module.exports = router;
