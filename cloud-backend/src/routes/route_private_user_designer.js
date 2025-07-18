
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


// add question to a ballot
router.post("/ballot/:uid/question", function(req, res, next) {
    routeUtils.apiPost(req, res, gConfig.app.apiBallot.async_addOrEditQuestion.bind(gConfig.app.apiBallot), {
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
      uid_ballot: req.params.uid? parseInt(req.params.uid) : null,
      uid_question: req.body.uid? parseInt(req.body.uid) : null,
      did: req.user.did? req.user.did: null,
      title: req.body.title? decodeURIComponent(decodeURIComponent(req.body.title)): null,
      rich_text: req.body.rich_text? decodeURIComponent(decodeURIComponent(req.body.rich_text)): null,
      link: req.body.link? decodeURIComponent(decodeURIComponent(req.body.link)): null,
      type: req.body.type? req.body.type: "select",
      aChoice: req.body.aChoice? req.body.aChoice: [],
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
