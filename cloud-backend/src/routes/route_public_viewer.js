const express = require('express');
const router = express.Router();

// all routes here start with               api/v1/public/viewer/

/*
 *      Public routes
 */

// basic public info of system as (anon) viewer point of view
router.get("/", function(req, res, next) {
    res.send({data: {
        status: "running",
        app: gConfig.appName,
    }});
});

// view all (filtered) ballots
router.get('/ballots ', function (req, res, next) {
    // todo
});

// view a ballot's votes / status
router.get('/ballot/:uid ', function (req, res, next) {
        // todo
});

module.exports = router;
