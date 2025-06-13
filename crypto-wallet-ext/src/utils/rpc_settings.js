// src/utils/rpc_settings.js
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

// post wallet type (Cardano) to the server
export const srv_postWalletType= async(objParam, _token) => {
  return srv_postRoute(API_ROUTE+'auth/wallet', {    
    chain: objParam.chain? objParam.chain: null,
    id: objParam.id? objParam.id: null,
    name: objParam.name? objParam.name: null,
    logo: objParam.logo? objParam.logo: null,
    networkId: objParam.networkId? parseInt(objParam.networkId): 0,
  }, _token);
}

