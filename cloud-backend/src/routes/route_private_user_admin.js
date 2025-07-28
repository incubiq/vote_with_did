
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

// Update a Ballot
router.patch("/ballot/:uid", function(req, res, next) {
    routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_updateBallotByAdmin.bind(gConfig.app.apiBallot), {
      canEditBallot: req.user.canEditBallot? req.user.canEditBallot: false,
      did: req.user.did? req.user.did: null,
      uid: req.params.uid? parseInt(req.params.uid) : null
    }, {
      name: req.body.name? decodeURIComponent(decodeURIComponent(req.body.name)): null,
      opening_at: req.body.opening_at? req.body.opening_at: null,
      closing_at: req.body.closing_at? req.body.closing_at: null,
      settings: req.body.settings? decodeURIComponent(decodeURIComponent(req.body.settings)): null
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
    canEditBallot: req.user.canEditBallot? req.user.canEditBallot: false,
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {
    rules: req.body.rules? JSON.parse(decodeURIComponent(decodeURIComponent(req.body.rules))) : null,
  });
});

// Publish a ballot
router.patch("/ballot/:uid/publish", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiUserAdmin.async_publishBallot.bind(gConfig.app.apiUserAdmin), {
    canPublishBallot: req.user.canPublishBallot? req.user.canPublishBallot: false,
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {    
  });
});

// add question to a ballot
router.link("/ballot/:uid_ballot/question/:uid_question", function(req, res, next) {
    routeUtils.apiLink(req, res, gConfig.app.apiBallot.async_linkQuestion.bind(gConfig.app.apiBallot), {
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
      did: req.user.did? req.user.did: null,
      uid_ballot: req.params.uid_ballot? parseInt(req.params.uid_ballot) : null,    // 
      uid_question: req.params.uid_question? parseInt(req.params.uid_question) : null,
    });
});

// remove question from a ballot
router.unlink("/ballot/:uid_ballot/question/:uid_question", function(req, res, next) {
    routeUtils.apiUnlink(req, res, gConfig.app.apiBallot.async_unlinkQuestion.bind(gConfig.app.apiBallot), {
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
      did: req.user.did? req.user.did: null,
      uid_ballot: req.params.uid_ballot? parseInt(req.params.uid_ballot) : null,
      uid_question: req.params.uid_question? parseInt(req.params.uid_question) : null,
    });
});

// create a question
router.post("/question", function(req, res, next) {
    routeUtils.apiPost(req, res, gConfig.app.apiBallot.async_createQuestion.bind(gConfig.app.apiBallot), {
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
      did: req.user.did? req.user.did: null,
      title: req.body.title? decodeURIComponent(decodeURIComponent(req.body.title)): null,
      rich_text: req.body.rich_text? decodeURIComponent(decodeURIComponent(req.body.rich_text)): null,
      link: req.body.link? decodeURIComponent(decodeURIComponent(req.body.link)): null,
      type: req.body.type? req.body.type: "select",
      aChoice: req.body.type=="bool"? [{text: "yes", value: true}, {text: "no", value: false}]: req.body.aChoice? req.body.aChoice: [],
    });
});

// get a question
router.get("/question/:uid", function(req, res, next) {
    routeUtils.apiGet(req, res, gConfig.app.apiBallot.async_findQuestion.bind(gConfig.app.apiBallot), {
      uid: req.params.uid? parseInt(req.params.uid) : null,
      did: req.user.did? req.user.did: null,
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
    });
});

// edit a question
router.patch("/question/:uid", function(req, res, next) {
    routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_updateQuestion.bind(gConfig.app.apiBallot), {
      uid: req.params.uid? parseInt(req.params.uid) : null,
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
    }, {
      title: req.body.title? decodeURIComponent(decodeURIComponent(req.body.title)): null,
      rich_text: req.body.rich_text? decodeURIComponent(decodeURIComponent(req.body.rich_text)): null,
      link: req.body.link? decodeURIComponent(decodeURIComponent(req.body.link)): null,
      type: req.body.type? req.body.type: "select",
      aChoice: req.body.type=="bool"? [{text: "yes", value: true}, {text: "no", value: false}]: req.body.aChoice? JSON.parse(decodeURIComponent(decodeURIComponent(req.body.aChoice))): [],
    });
});

// delete a question 
router.delete("/question/:uid", function(req, res, next) {
    routeUtils.apiDelete(req, res, gConfig.app.apiBallot.async_deleteQuestion.bind(gConfig.app.apiBallot), {
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
      uid: req.params.uid? parseInt(req.params.uid) : null,
    });
});

module.exports = router;
