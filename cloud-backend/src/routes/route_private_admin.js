
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/private/admin/

/*
 *      Private routes (requires login)
 */

/*
 *      status
 */

// get authenticated admin details
router.get("/", function(req, res, next) {
//    todo
});


/*
 *      admin routes
 */

// Create a Ballot
router.post("/ballot", function(req, res, next) {
    routeUtils.apiPost(req, res, gConfig.app.apiBallot.async_createBallot.bind(gConfig.app.apiBallot), {
      did: req.user.did? req.user.did: null,
      did: req.body.name? decodeURIComponent(decodeURIComponent(req.body.name)): null
    });
});

// get one of my Ballot (as admin)
router.get("/ballot/:uid", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiBallot.async_findMyBallot.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  });
});

// Define voting rules for a ballot
router.patch("/ballot/:uid/rules", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_updateBallotByAdmin.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {
    rules: req.body.rules? JSON.parse(decodeURIComponent(decodeURIComponent(req.body.rules))) : null,
  });
});

// Publish a ballot
router.patch("/ballot/:uid/publish", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_publishBallot.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {    
  });
});

module.exports = router;
