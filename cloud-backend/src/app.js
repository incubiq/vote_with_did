const express = require('express');
const path = require('path');
const srvIdentus = require("./utils/util_identus_identity");
const srvUtil = require("./utils/util_services");
const srvIdentusUtil = require("./utils/util_identus_utils");
/*
 *      App Inits
 */

    module.exports = {
        createApp,
        async_initializeApp,
        async_pingIdentus
    };

    function createApp() {
        return express();
    }

    async function async_initializeApp(objParam) {
        try {
            let app=objParam.app;
            let config=objParam.config;

            // utilities
            const cors = require('cors');
            const bodyParser= require('body-parser');
            const cookieParser=require('cookie-parser');
            const cookieSession=require('cookie-session');

            // set the accepted access-control-allow-methods
            app.use(cors({
                methods: ["OPTIONS", "PUT", "GET", "POST", "PATCH", "DELETE", "LINK", "UNLINK"]
            }));

            app.use(bodyParser.urlencoded({ extended: false }));
            app.use(bodyParser.json({limit: '50mb'})); 
            app.use(cookieParser());
            app.use(require('express-session')({
                secret: config.jwtKey,
                name: config.appName,
                resave: true,
                saveUninitialized: true,
                cookie : {
                    sameSite: 'Lax'
                }
            }));

            await async_continueInitialize(app);         
            return true;
        }
        catch(err) {
            return false;
        }
    }

    async function async_continueInitialize(app) {
        try {
            await async_initializeDatabase();

            initializeAPIs(app);   
            initializeRedirections(app);
            initializeRoutes(app);
            initializeViews(app);     
            async_pingIdentus();
        }
        catch(err) {
            srvUtil.consoleLog(err && err.message? err.message : err.statusText);
            throw err;
        }
    }

    async function async_pingIdentus() {
            // test Identus agent connection
            try {
                await srvIdentus.async_getEntities();
                srvUtil.consoleLog("Identus is ready at "+gConfig.identus.host);
                gConfig.identus.isLive=true;
                return true;
            }
            catch(err) {
                gConfig.identus.isLive=false;
                if(err && err.response &&  err.response.status && err.response.status==401) {
                    srvUtil.consoleLog("Critical: not authorised as Admin (probably a bad admin pwd) ")
                }
                srvUtil.consoleLog("FATAL: Identus not found at "+gConfig.identus.host + "("+(err.code? err.code: "") + " "+ (err.errno? err.errno: "") + " "+(err.message? err.message:"") + ")" )
                return false;
            }
    }

/*
 *      App security
 */

    function initializeRedirections(app) {

        // change header security requirements here
        const objHeaders= {
            headers: {
                "X-Content-Type-Options": "nosniff",
                "X-XSS-Protection": "1; mode=block",
                "Content-Security-Policy":
                    gConfig.isDebug?
                        "default-src 'self' 'unsafe-eval' data: http://localhost:"+gConfig.port +" https://*.amazonaws.com http://identus.opensourceais.com https://identity.opensourceais.com ; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:"+gConfig.port +" unpkg.com http://identus.opensourceais.com https://identity.opensourceais.com ; " +
                        "style-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:"+gConfig.port +" fonts.googleapis.com  cdnjs.cloudflare.com ; " +
                        "font-src  http://localhost:"+gConfig.port + " fonts.gstatic.com cdnjs.cloudflare.com ; " +
                        "connect-src ws://localhost:"+gConfig.port +" http://localhost:"+gConfig.port +" 'self' accounts.youtube.com *.trycloudflare.com http://identus.opensourceais.com https://identity.opensourceais.com  ; " +
                        "worker-src blob: ; " +
                        "img-src 'self' data: http://localhost:"+gConfig.port +" googleusercontent.com googletagmanager.com ; " +
                        "frame-src 'self'  youtube.com youtu.be ;" +
                        "media-src 'self'  http://localhost:"+gConfig.port +" http://*:"+gConfig.port +" youtube.com youtu.be ;"
                        :
                        "default-src 'self' 'unsafe-eval' data: https://*.amazonaws.com http://identus.opensourceais.com https://identity.opensourceais.com ; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' shortfakes.com  cdnjs.cloudflare.com www.googletagmanager.com unpkg.com http://identus.opensourceais.com https://identity.opensourceais.com ; " +
                        "style-src 'self' 'unsafe-eval' 'unsafe-inline' data:  shortfakes.com fonts.googleapis.com cdnjs.cloudflare.com ; "  +
                        "font-src fonts.gstatic.com  cdnjs.cloudflare.com ; "+
                        "connect-src  'self'  *.google-analytics.com *.trycloudflare.com http://identus.opensourceais.com https://identity.opensourceais.com ; " +
                        "worker-src blob: ; " +
                        "img-src 'self' data:  googleusercontent.com googletagmanager.com ; " +
                        "frame-src 'self' www.youtube.com youtube.com www.youtu.be youtu.be  ;" +
                        "media-src 'self' blob:   www.youtube.com youtube.com www.youtu.be youtu.be ; ",
                        "Permissions-Policy": "camera=(self) microphone=(self)"
            }
        }

        app.all('/*', function (req, res, next) {

            var strAllow="Origin, X-Requested-With, charset, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials, x-www-form-urlencoded";
            res.header("Access-Control-Allow-Origin", "*");
            res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, PATCH, DELETE, OPTIONS, LINK, UNLINK');

            // override origin?
            if(objHeaders.headers.hasOwnProperty("Access-Control-Allow-Origin")) {
                res.header("Access-Control-Allow-Origin", objHeaders.headers["Access-Control-Allow-Origin"]);
            }
            if(objHeaders.headers.hasOwnProperty("X-Content-Type-Options")) {
                res.header("X-Content-Type-Options", objHeaders.headers["X-Content-Type-Options"]);
            }
            if(objHeaders.headers.hasOwnProperty("X-XSS-Protection")) {
                res.header("X-XSS-Protection", objHeaders.headers["X-XSS-Protection"]);
            }
            if(objHeaders.headers.hasOwnProperty("X-Frame-Options")) {
                res.header("X-Frame-Options", objHeaders.headers["X-Frame-Options"]);
            }
            if(objHeaders.headers.hasOwnProperty("Content-Security-Policy")) {
                res.header("Content-Security-Policy", objHeaders.headers["Content-Security-Policy"]);
            }

            for (var prop in objHeaders.headers) {
                if (Object.prototype.hasOwnProperty.call(objHeaders.headers, prop)) {
                    strAllow=strAllow+", "+prop;
                }
            }

            res.removeHeader('X-Powered-By');
            res.header("Access-Control-Allow-Headers", strAllow);
            res.header('Pragma', "no-cache");
            res.header('Cache-Control', "private, no-cache, no-store, must-revalidate");
            res.header("Strict-Transport-Security", "max-age=31536000");        // to force HTTPS 

            next();
        });
    }

/*
 *      App routes (incl. authentication routes)
 */

    function initializeRoutes(app) {

        // Our routes 
        const routeWallet = require('./routes/route_wallet');
        const routeConnections = require('./routes/route_connections');
        const routeIdentity = require('./routes/route_did_identity');
        const routeSchema = require('./routes/route_did_schema');
        const routeDefinition = require('./routes/route_did_definition');
        const routeCredentials = require('./routes/route_did_credentials');
        const routeProof = require('./routes/route_did_proof');
        const routePublicAPI = require('./routes/route_public');
        const routeUI = require('./routes/route_ui');
        const routePrivateSuperAdminAPI = require('./routes/route_superadmin');
        const routePrivateAdmin = require('./routes/route_private_admin');
        const routePrivateDesigner = require('./routes/route_private_designer');
        const routePrivateVoter = require('./routes/route_private_voter');
        const routePublicViewer = require('./routes/route_public_viewer');

        // If we don't want to redirect on authentication error...
        const fnNoRedirect = function (req, res, next) {
            req.noRedirect = true;
            next();
        };

        // all DID routes
        app.use('/api/v1/wallet', routeWallet);
        app.use('/api/v1/p2p', routeConnections);
        app.use('/api/v1/identity', routeIdentity);
        app.use('/api/v1/schema', routeSchema);
        app.use('/api/v1/vc', routeCredentials);
        app.use('/api/v1/proof', routeProof);
        app.use('/api/v1/definition', routeDefinition);


        app.use('/api/v1/private/admin', routePrivateAdmin);          // ballot admin
        app.use('/api/v1/private/designer', routePrivateDesigner);    // ballot designer
        app.use('/api/v1/private/voter', routePrivateVoter);          // ballot voter
        app.use('/api/v1/public/viewer', routePublicViewer);          // vote results viewer

        // public API route
        app.use('/api/v1/public', routePublicAPI);

        // UI route
        app.use('/', routeUI);
        // Admin API route
//        app.use('/api/v1/private/admin', routePrivateAdminAPI);
        
        app.use('/api/v1/superadmin',
            (req, res, next) => {
                if (req.headers['x-admin-api-key'] === srvIdentusUtil.getIdentusAdminKey()) {
                    return next();
                }
                return res.status(401).json({ 
                    data: null,
                    status: 401,
                    statusText: "Unauthorized" 
                });
            },
            routePrivateSuperAdminAPI
        );
    
        //  API failure
        app.use('/api/v1',  function (req, res, next) {
            res.status(400);
            res.json({
                data:null,
                status: 400,
                statusText: "What made you think you could call this?"
            })
        });       
    }

    function initializeViews(app) {

        const express = require('express');
        const exphbs = require('express-handlebars-multi');

        let dirApp=path.join(__dirname, "./");        
        var aLayout=[path.join(dirApp, 'views/layouts/')];
        var aPartial=[path.join(dirApp, 'views/partials/')];
        var aView=[path.join(dirApp, 'views/')];
        var hbs = exphbs({
            ext: '.hbs',
            layoutDirs: aLayout,
            partialDirs: aPartial,
            helpers: {
                ifCond: function (v1, operator, v2, options) {
                    switch (operator) {
                        case '==':
                            return (v1 == v2) ? options.fn(this) : options.inverse(this);
                        case '!=':
                            return (v1 != v2) ? options.fn(this) : options.inverse(this);
                        case '===':
                            return (v1 === v2) ? options.fn(this) : options.inverse(this);
                        case "!==":
                            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                        case '<':
                            return (v1 < v2) ? options.fn(this) : options.inverse(this);
                        case '<=':
                            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                        case '>':
                            return (v1 > v2) ? options.fn(this) : options.inverse(this);
                        case '>=':
                            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                        case '&&':
                            return (v1 && v2) ? options.fn(this) : options.inverse(this);
                        case '||':
                            return (v1 || v2) ? options.fn(this) : options.inverse(this);
                        default:
                            return options.inverse(this);
                    }
                },
                encode: function(value) {
                    return encodeURIComponent(encodeURIComponent(value));
                }
            }
        });
        app.engine('.hbs', hbs);
        app.set('view engine', '.hbs');
        app.set('views', aView);
     
        // react app as website entry point
        let indexProd="../static_website/"         // this is where we get all static files from REACT app (if want to debug app with backend calls, run it from localhost:3000, not from here)
        let tmpPath=path.join(__dirname, indexProd);
        app.use('/', express.static(tmpPath));

        // static files..
        let dirRoot=path.join(__dirname, "../");        
        app.use(express.static(dirRoot));            
        app.use('/assets', express.static(path.join(dirRoot, 'assets')));

        // catch and forward specific error handler
        app.use(function (req, res, next) {
            res.redirect("/web/cracked");
        })                
    }

    async function async_initializeDatabase() {
        try {
            const dbMongoose = require('./dbaccess/mongodb');
            let objInit = await dbMongoose.async_initializeMongoose();
            return objInit;
        }
        catch(err) {
            srvUtil.consoleLog ("Could not init DB!")
            throw err;
        }
    }


    function initializeAPIs(app) {

        const classBallot= require('./api/api_ballot');
        app.apiBallot=new classBallot();

        const classViewer= require('./api/api_user_viewer');
        app.apiViewer=new classViewer();

        const classVoter= require('./api/api_user_voter');
        app.apiVoter=new classVoter();
    }