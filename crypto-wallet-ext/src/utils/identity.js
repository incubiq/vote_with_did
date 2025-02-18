// src/utils/identity.js
import {  rootAPI,
  isProd,
  getUserToken,
  API_ROUTE,
  API_PRIVATEROUTE,
  API_PUBLICROUTE,
  API_ADMINROUTE,
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

