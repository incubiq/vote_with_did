// src/utils/rpc_identity.js
import {  rootAPI,
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
  srv_unlinkRoute } from "./base_rpc";


/*
 *    WALLET
 */

// get the Cardano Wallet from mnemonic
export const srv_getWalletInfo= async(mnemonic) => {
  return srv_getRoute(API_ROUTE+'wallet/'+mnemonic);
}

/*
 *    AUTH
 */

// authenticate user into backend
export const srv_postAuth= async(objUser) => {
  return srv_postRoute(API_ROUTE+'auth/', {
    username: objUser.username,
    seed: objUser.seed
  });
}

/*
 *    DIDs
 */

// Get User DID
export const srv_getDid= async(_apiKey) => {
  return srv_getRoute(API_ROUTE+'identity/dids', {apikey: _apiKey});
}

// Create Entity-wallet-DID for new user
export const srv_postEntity= async(objParam, _token) => {
  return srv_postRoute(API_PRIVATEROUTE+'voter/entity', {
    name:objParam.name,
    role: objParam.role,
    mnemonic: objParam.mnemonic,
  }, {token: _token});
}

/*
 *    VCs
 */

// Get User VC offers
export const srv_getCredsOffers= async(_apiKey) => {
  return srv_getRoute(API_ROUTE+'vc/offers', {apikey: _apiKey});
}

// Get User VC proofs
export const srv_getCredsProofs= async(_apiKey) => {
  return srv_getRoute(API_ROUTE+'proof/presentations', {apikey: _apiKey});
}

