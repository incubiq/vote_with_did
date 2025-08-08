
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
 *      status / authorizations
 */

// get authenticated voter details
router.get("/", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserVoter.async_getUser.bind(gConfig.app.apiUserVoter), {
    key: req.user && req.user.key? req.user.key: null
  });
});

// request admin rights for creating ballots
router.post("/authorize/admin", function(req, res, next) {
  routeUtils.apiPost(req, res, gConfig.app.apiUserVoter.async_authorizeAdmin.bind(gConfig.app.apiUserVoter), {
      key: req.user && req.user.key? req.user.key: null
  });
});

router.post("/authorize/designer", function(req, res, next) {
  routeUtils.apiPost(req, res, gConfig.app.apiUserVoter.async_authorizeDesigner.bind(gConfig.app.apiUserVoter), {
      key: req.user && req.user.key? req.user.key: null
  });
});

router.post("/authorize/voter", function(req, res, next) {
  routeUtils.apiPost(req, res, gConfig.app.apiUserVoter.async_authorizeVoter.bind(gConfig.app.apiUserVoter), {
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

/* VC issuance */

// issue a VC : Proof of funds
router.link("/proof/assets", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiUserVoter.async_issueProofOfFunds.bind(gConfig.app.apiUserVoter), {
    address: req.query.address? req.query.address: null,
    chain: req.query.chain? req.query.chain: null,
    networkId: req.query.networkId? parseInt(req.query.networkId): 0,
    uid_ballot: req.query.uid_ballot? parseInt(req.query.uid_ballot): null,   // used when issuing for registering creds for a ballot before voting opens
    key: req.user && req.user.key? req.user.key: null
  });
});

// issue a VC : Proof of Minimum Balance
router.link("/proof/minbalance", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiUserVoter.async_issueProofOfMinimumBalance.bind(gConfig.app.apiUserVoter), {
    address: req.query.address? req.query.address: null,
    chain: req.query.chain? req.query.chain: null,
    networkId: req.query.networkId? parseInt(req.query.networkId): 0,
    requirement_minimum: req.query.minimum? parseInt(req.query.minimum): 0,
    uid_ballot: req.query.uid_ballot? parseInt(req.query.uid_ballot): null,   // used when issuing for registering creds for a ballot before voting opens
    key: req.user && req.user.key? req.user.key: null
  });
});

// issue a Proof of wallet ownership (when user confirms owning a wallet)
router.link("/proof/wallet", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiUserVoter.async_ensureProofOfOwnership.bind(gConfig.app.apiUserVoter), {
    address: req.query.address? req.query.address: null,
    chain: req.query.chain? req.query.chain: null,
    networkId: req.query.networkId? parseInt(req.query.networkId): 0,
    key: req.user && req.user.key? req.user.key: null
    });
});

// issue a VC : Proof of Vote
router.link("/proof/vote", function(req, res, next) {
  routeUtils.apiLink(req, res, gConfig.app.apiUserVoter.async_issueProofOfVote.bind(gConfig.app.apiUserVoter), {
    a_thid_eligibility: req.query.thids? req.query.thids: [],           // ALL VC Proofs (thids) that gave user eligibility to vote
    uid_ballot: req.query.uid_ballot? parseInt(req.query.uid_ballot): null,   
    key: req.user && req.user.key? req.user.key: null
  });
});


/*
 *      voter routes
 */

// get all available ballots
router.get("/ballots", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserVoter.async_getAvailableBallots.bind(gConfig.app.apiUserVoter), {
    did: req.user.did? req.user.did: null,
    isOpenForRegistration: req.query.isOpenForRegistration==true,
    isOpenForVote: req.query.isOpenForVote==true,
    isOpenForStats: req.query.isOpenForStats==true
  });
});

// check if voter can vote on ballot (meet all requirements)
router.get("/ballot/:uid/canvote", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserVoter.async_canVote.bind(gConfig.app.apiUserVoter), {
    did: req.user.did? req.user.did: null,
    uid: req.params.uid? parseInt(req.params.uid): null,
    aProof: req.query.aProof? JSON.parse(decodeURIComponent(decodeURIComponent(req.query.aProof))): [],         // all VC Proofs the user has provided to validate the vote
  });
});

// Cast a vote on a ballot    !!!! TODO - likely do this via DAPP (not cloud backend)
router.post("/ballot/:uid", function(req, res, next) {
  routeUtils.apiPost(req, res, gConfig.app.apiUserVoter.async_vote.bind(gConfig.app.apiUserVoter), {
    key: req.user && req.user.key? req.user.key: null,
    did: req.user.did? req.user.did: null,
    uid: req.params.uid? parseInt(req.params.uid): null,
    aProof: req.body.aProof? req.body.aProof: [],         // all VC Proofs the user has provided to validate the vote
    aVote: req.body.aVote? req.body.aVote: []             // all votes (answer per each question)
  });
});

// get vote history 
router.get("/history", function(req, res, next) {
  routeUtils.apiGet(req, res, //todo
  );
});

module.exports = router;
