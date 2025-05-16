
const getCookieName = () =>  {
    if(gConfig.isDebug) {
        return "jwt_DEBUG_token_"+gConfig.appName;
    }
    return "jwt_token_"+gConfig.appName;
}

 // same site cookie info...
function getCookieOptions() {
    var objOptions= {
        sameSite: "Lax"
    };
    if(!gConfig.isDebug){
        objOptions.secure=true;
    }
    return objOptions
}

module.exports = {
    getCookieName,
    getCookieOptions
}