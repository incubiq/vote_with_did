
const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');
const identusUtils = require('../utils/util_identus_utils');
const srvIdentus = require("../utils/util_identus_identity");

// all routes here start with               api/v1/private/designer/

/*
 *      Private routes (requires login)
 */

/*
 *      status
 */

// get authenticated designer details
router.get("/", function(req, res, next) {
//    todo
});


/*
 *      designer routes
 */

// get details of a Ballot I can edit (as designer)
router.get("/ballot/:uid", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiBallot.async_findBallotForDesigner.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  });
});


// edit a Ballot
router.patch("/ballot/:uid", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_updateBallotByDesigner.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {
    settings: req.body.settings? JSON.parse(decodeURIComponent(decodeURIComponent(req.body.settings))) : null
  });
});

// submit a Ballot for publishing (will require admin approval)])
router.patch("/ballot/:uid/prepublish", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_prepublishBallot.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {
  });
});

module.exports = router;
