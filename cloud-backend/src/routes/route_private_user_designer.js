
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
 *      designer routes
 */

// get details of a Ballot I can edit (as designer)
router.get("/ballot/:uid", function(req, res, next) {
  routeUtils.apiGet(req, res, gConfig.app.apiBallot.async_findBallotForDesigner.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
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

// submit a Ballot for publishing (will require admin approval)])
router.patch("/ballot/:uid/prepublish", function(req, res, next) {
  routeUtils.apiPatch(req, res, gConfig.app.apiBallot.async_prepublishBallot.bind(gConfig.app.apiBallot), {
    uid: req.params.uid? parseInt(req.params.uid) : null,
    did: req.user.did? req.user.did: null
  }, {
  });
});

module.exports = router;
