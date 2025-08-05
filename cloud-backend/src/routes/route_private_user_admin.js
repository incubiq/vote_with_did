const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');

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
      name: req.body.name? decodeURIComponent(req.body.name): null
    });
});

// Update a Ballot
router.patch("/ballot/:uid", function(req, res, next) {
    routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_updateBallotByAdmin.bind(gConfig.app.apiBallot), {
      canEditBallot: req.user.canEditBallot? req.user.canEditBallot: false,
      did: req.user.did? req.user.did: null,
      uid: req.params.uid? parseInt(req.params.uid) : null
    }, {
      name: req.body.name? decodeURIComponent(req.body.name): null,
      opening_at: req.body.opening_at? req.body.opening_at: null,
      closing_at: req.body.closing_at? req.body.closing_at: null,
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

// publish a ballot (set open / close  registration ;  set open /close for voting)
router.patch("/ballot/:uid/publish", function(req, res, next) {
  const openingRegistration_at = req.body.openingRegistration_at? new Date(decodeURIComponent(req.body.openingRegistration_at)): null;
  const closingRegistration_at = req.body.closingRegistration_at? new Date(decodeURIComponent(req.body.closingRegistration_at)): null;
  const openingVote_at = req.body.openingVote_at? new Date(decodeURIComponent(req.body.openingVote_at)): null;
  const closingVote_at = req.body.closingVote_at? new Date(decodeURIComponent(req.body.closingVote_at)): null;
  routeUtils.apiPatch(req, res, gConfig.app.apiUserAdmin.async_publishBallot.bind(gConfig.app.apiUserAdmin), {
    canPublishBallot: req.user.canPublishBallot? req.user.canPublishBallot: false,
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null,
    username: req.user.username? req.user.username: null
  }, {    
    openingRegistration_at: openingRegistration_at,
    closingRegistration_at: closingRegistration_at,
    openingVote_at: openingVote_at,
    closingVote_at: closingVote_at,
    requirement: req.body.requirement? req.body.requirement: null,
    extra: req.body.extra? JSON.parse(req.body.extra): []
  });
});
 
   
module.exports = router;
