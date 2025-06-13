
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/private/admin/

/*
 *      status routes
 */

  
// get authenticated voter details
router.get("/", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserAdmin.async_getUser.bind(gConfig.app.apiUserAdmin), {
    key: req.user && req.user.key? req.user.key: null
  });
});


/*
 *      content creator routes
 */
// Create a Ballot
router.post("/ballot", function(req, res, next) {
    routeUtils.apiPost(req, res, gConfig.app.apiUserAdmin.async_createBallot.bind(gConfig.app.apiUserAdmin), {
      canCreateBallot: req.user.canCreateBallot? req.user.canCreateBallot: false,
      did: req.user.did? req.user.did: null,
      name: req.body.name? decodeURIComponent(decodeURIComponent(req.body.name)): null
    });
});

// get ALL my Ballot
router.get("/ballots", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserAdmin.async_getMyBallots.bind(gConfig.app.apiUserAdmin), {
    did: req.user.did? req.user.did: null,
  });
});

// get one of my Ballot (as admin)
router.get("/ballot/:uid", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiUserAdmin.async_findMyBallot.bind(gConfig.app.apiUserAdmin), {
    did: req.user.did? req.user.did: null,
    uid: req.params.uid? parseInt(req.params.uid) : null,
  });
});

// Define voting rules for a ballot
router.patch("/ballot/:uid/rules", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiUserAdmin.async_updateBallotRules.bind(gConfig.app.apiUserAdmin), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {
    rules: req.body.rules? JSON.parse(decodeURIComponent(decodeURIComponent(req.body.rules))) : null,
  });
});

// Publish a ballot
router.patch("/ballot/:uid/publish", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiUserAdmin.async_publishBallot.bind(gConfig.app.apiUserAdmin), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {    
  });
});


module.exports = router;
