const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const cUser=require('../const/const_users');
const cCookie=require('../const/const_cookie');

// all routes here start with               api/v1/auth/
/*
 *      Public routes
 */

router.post("/", function(req, res, next) {
    const { seed } = req.body;
  
    if (!seed) {
        return res.status(400).json({ error: 'Seed is required' });
    }
        
    // Generate JWT token
    const token = jwt.sign({ 
        username: req.body.username, 
        }, 
        gConfig.jwtKey,
        { expiresIn: gConfig.authentication_expire } 
    );

    cUser.addUser(req.body.username, seed);

    res.cookie(cCookie.getCookieName(), token, {
        httpOnly: false,        // true = Prevents JavaScript access to the cookie
        secure:  gConfig.isDebug? false : true,          // Only sent over HTTPS
        sameSite: 'Lax',    // Prevents CSRF attacks
        maxAge:  72 * 60 * 60 * 1000  // harcoded this one (should change it to the config value)  
    });
    return res.json({ data: {
        token: token }
    });
});


module.exports = router;
