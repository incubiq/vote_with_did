
const Q = require('q');

function async_initializeMongoose() {
    var deferred = Q.defer();

    // are we in prod or dev??
    var envDevProd="prod";
    if(gConfig.isDebug) {
        console.log("Connecting to MongoDB DEV env");
        envDevProd="dev";
    }
    else {
        console.log("Connecting to MongoDB PROD env");
    }

    const mongoose = require('mongoose');
    mongoose.set("strictQuery", false);
    mongoose.connect(gConfig.database[envDevProd], {
    //    useUnifiedTopology: true          // had to remove this or Mongo is NOT STABLE (timererror)
    });

    mongoose.Promise = global.Promise;
    var db = mongoose.connection;
    db.on('error', function(err){
        deferred.reject({
            data: null,
            status: 400,
            statusText: "cannot connect to MongoDB: "+err.message
        });
    });
    db.once('open', function() {
        deferred.resolve(true);
        // we're connected!
    });
    return deferred.promise;
}

module.exports = {
    async_initializeMongoose,
};
