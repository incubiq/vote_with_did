const express = require('express');
const router = express.Router();
const routeUtils = require('./route_utils');

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
 *      designer routes / Ballot
 */

// get details of a Ballot I can edit (as designer)
router.get("/ballot/:uid", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiBallot.async_findBallotForDesigner.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  });
});

// submit a Ballot for publishing (will require admin approval)])
router.patch("ballot/:uid/prepublish", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_prepublishBallot.bind(gConfig.app.apiBallot), {
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

/*
 *      designer routes / Questions
 */

// create a question
router.post("/question", function(req, res, next) {
    routeUtils.apiPost(req, res, gConfig.app.apiBallot.async_createQuestion.bind(gConfig.app.apiBallot), {
      canAddQuestion: req.user.canAddQuestion? req.user.canAddQuestion: false,
      did: req.user.did? req.user.did: null,
      title: req.body.title? decodeURIComponent(req.body.title): null,
      rich_text: req.body.rich_text? decodeURIComponent(req.body.rich_text): null,
      link: req.body.link? decodeURIComponent(req.body.link): null,
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
      title: req.body.title? decodeURIComponent(req.body.title): null,
      rich_text: req.body.rich_text? decodeURIComponent(req.body.rich_text): null,
      link: req.body.link? decodeURIComponent(req.body.link): null,
      type: req.body.type? req.body.type: "select",
      aChoice: req.body.type=="bool"? [{text: "yes", value: true}, {text: "no", value: false}]: req.body.aChoice? JSON.parse(decodeURIComponent(req.body.aChoice)): [],
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