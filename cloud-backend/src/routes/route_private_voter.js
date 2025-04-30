
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/private/voter/

/*
 *      Private routes (requires login)
 */

/*
 *      status
 */

// get authenticated voter details
router.get("/", function(req, res, next) {
//    todo
});

// get voter's DID (or generate one if none)
router.get("/did", function(req, res, next) {
  routeUtils.apiGet(req, res, //todo
  );
});

// get voter's VCs (creds)
router.get("/vcs", function(req, res, next) {
  routeUtils.apiGet(req, res, //todo
  );
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
