
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/private/voter/

/*
 *      Private routes (requires login)
 */

// create the Digital ID of the (first time) logged user / voter
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
  routeUtils.apiGet(req, res, gConfig.app.apiUserVoter.async_getUser.bind(gConfig.app.apiUserVoter), {
    key: req.user && req.user.key? req.user.key: null
  });
});


/*
 *    DIDs and VCs
 */

// get voter's DID (or generate one if none)
router.get("/did", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserVoter.async_getUserDIDs.bind(gConfig.app.apiUserVoter), {
    key: req.user && req.user.key? req.user.key: null
  });
});

// get voter's VCs/Proofs 
router.get("/proofs", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserVoter.async_getUserWithProofs.bind(gConfig.app.apiUserVoter), {
    claim_type: req.query.claim_type? req.query.claim_type: "*",
    key: req.user && req.user.key? req.user.key: null
  });
});

// issue a VC/Proof of funds
router.link("/assets", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiUserVoter.async_issueProofOfFunds.bind(gConfig.app.apiUserVoter), {
    address: req.query.address? req.query.address: null,
    chain: req.query.chain? req.query.chain: null,
    networkId: req.query.networkId? parseInt(req.query.networkId): 0,
    key: req.user && req.user.key? req.user.key: null
  });
});

// issue a Proof of wallet ownership (when user confirms owning a wallet)
router.link("/wallet", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiUserVoter.async_ensureProofOfOwnership.bind(gConfig.app.apiUserVoter), {
    address: req.query.address? req.query.address: null,
    chain: req.query.chain? req.query.chain: null,
    networkId: req.query.networkId? parseInt(req.query.networkId): 0,
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
