import { getTokenFromCookie} from "./cookies.js";

let  rootAPI="https://identity.opensourceais.com"
let _userToken=null;

const isExtension = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

const isProd = () => {
  if(isExtension()) {
    // todo: change this later
    return false
  }

  const env = process.env.NODE_ENV
  if(!__IS_PROD__) {
    return false;
  }
  return !(env == "development") ;
}

if (isProd()) {
  console.log ("PROD ENV detected");
}
else {
  console.log ("DEV ENV detected");
  rootAPI="http://localhost:8101";

} 

const API_ROUTE= rootAPI+"/api/v1/";
const API_PUBLICROUTE= rootAPI+"/api/v1/public/";
const API_PRIVATEROUTE= rootAPI+"/api/v1/private/";
const API_ADMINROUTE= rootAPI+"/api/v1/private/admin/";
const API_SUPERADMINROUTE= rootAPI+"/api/v1/superadmin/";

const getUserToken = () => {
  return _userToken;
}

const getJSONHeader = (_token) => {
  let headers = {'Content-Type': 'application/json'}
  let _cookie_token=getTokenFromCookie(document.cookie);

  // for localhost:3000 (debug) we do this
  if(_token===null || _token===undefined) {
    _token = {token: _userToken};
  }
  
  if(_token) {
    if(_token.token) {
      _cookie_token=_token.token;
    }
    headers["Authorization"]="Bearer " + _cookie_token;

    if(_token.apikey) {
      headers["apikey"]= _token.apikey;
    }
    if(_token["x-admin-api-key"]) {
      headers["x-admin-api-key"]= _token["x-admin-api-key"];
    }    
  }
  return headers;
}

const srv_getRoute = async(route, _token) => {
  try {
    let isPrivate=route.includes(API_PRIVATEROUTE);
    let _query={
      method: 'GET',
      headers: getJSONHeader(_token),
      credentials: 'include',
    }

    const response = await fetch(route, _query);
    const json = await response.json();
    return json;
  } catch(error) {
    console.log("Error GET "+ error? error : "");
    return {data: null};
  }
}

const srv_getUniqueRoute = async(route, _token) => {
  try {
    let ts=new Date().getTime();
    let _route=route+"?ts="+ts
    return srv_getRoute(_route, _token);
  } catch(error) {
    console.log("Error GET Unique "+ error? error : "");
    return {data: null};
  }
}

const srv_patchRoute = async (route, data, _token) => {
  return _srv_pRoute('PATCH', route, data, _token);
}

const srv_postRoute = async (route, data, _token) => {
  return _srv_pRoute('POST', route, data, _token);
}

const _srv_pRoute = async (verb, route, data, _token) => {
  try {
    let jsonStr=data? JSON.stringify(data): null;
    let _query={
      method: verb,
      headers: getJSONHeader(_token),
      credentials: 'include',
    }

    if(jsonStr) {
      _query.body=jsonStr;
    }

    const response = await fetch(route, _query);
    const json = await response.json();
    return json;
  } catch(error) {
    console.log(error);
    return {data: null};
  }
}

const srv_deleteRoute = async (route, _token) => {
  try {
    let _query={
      method: 'DELETE',
      headers: getJSONHeader(_token),
      credentials: 'include',
    }

    const response = await fetch(route, _query);
    if(response.status!==204) {
      return response;
    }
    return {data: null};
  } catch(error) {
    console.log(error);
    return {data: null};
  }
}

const srv_linkRoute = async (route, _token) => {
  try {
    let _query={
      method: 'LINK',
      headers: getJSONHeader(_token),
      credentials: 'include',
    }

    const response = await fetch(route, _query);
    const json = await response.json();
    return json;
  } catch(error) {
    console.log(error);
    return {data: null};
  }
}

const srv_unlinkRoute = async (route, _token) => {
  try {
    let _query={
      method: 'UNLINK',
      headers: getJSONHeader(_token),
      credentials: 'include',
    }

    const response = await fetch(route, _query);
    const json = await response.json();
    return json;
  } catch(error) {
    console.log(error);
    return {data: null};
  }
}

export { 
  rootAPI,
  isProd,
  getUserToken,
  API_ROUTE,
  API_PRIVATEROUTE,
  API_PUBLICROUTE,
  API_ADMINROUTE,
  API_SUPERADMINROUTE,
  srv_getRoute, 
  srv_getUniqueRoute,
  srv_patchRoute,
  srv_postRoute,
  srv_deleteRoute,
  srv_linkRoute,
  srv_unlinkRoute
}