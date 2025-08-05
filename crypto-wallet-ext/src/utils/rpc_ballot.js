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
 *    BALLOT
 */

// create a ballot (with name)
export const srv_postCreateBallot= async(objParam, _token) => {
  return srv_postRoute(API_PRIVATEROUTE+'admin/ballot', {    
    name: objParam.name? objParam.name: null,
  }, _token);
}

// Update a ballot attr
export const srv_patchBallot= async(objParam, _token) => {
  return srv_patchRoute(API_PRIVATEROUTE+'admin/ballot/'+objParam.uid, {    
    name: objParam.name? objParam.name: null,
    opening_at: objParam.opening_at? objParam.opening_at: null,
    closing_at: objParam.closing_at? objParam.closing_at: null,
    settings: objParam.settings? encodeURIComponent(encodeURIComponent(objParam.settings)): null,
  }, _token);
}

// get a user's ballots (as admin)
export const srv_getBallots= async(objParam, _token) => {
  return srv_getRoute(API_PRIVATEROUTE+'admin/ballots', {    
  }, _token);
}

// get a user's specific ballot details
export const srv_getBallot= async(objParam, _token) => {
  return srv_getRoute(API_PRIVATEROUTE+'admin/ballot/'+objParam.uid, {    
  }, _token);
}

// update voting rules of a ballot
export const srv_patchBallotRules= async(objParam, _token) => {
  return srv_patchRoute(API_PRIVATEROUTE+'admin/ballot/'+objParam.uid+"/rules", {    
    rules: objParam.rules
  }, _token);
}

// pre-publish a ballot
export const srv_prepublishBallot= async(objParam, _token) => {
  return srv_patchRoute(API_PRIVATEROUTE+'designer/ballot/'+objParam.uid+"/prepublish", { 
  }, _token);
}

// publish a ballot
export const srv_publishBallot= async(objParam, _token) => {
  return srv_patchRoute(API_PRIVATEROUTE+'admin/ballot/'+objParam.uid+"/publish", { 
    openingVote_at: objParam.openingVote_at,
    closingVote_at: objParam.closingVote_at,
    openingRegistration_at: objParam.openingRegistration_at,
    closingRegistration_at: objParam.closingRegistration_at,
    requirement: objParam.requirement? requirement: null,
    extra: objParam.extra? JSON.stringify(objParam.extra): JSON.stringify([])
  }, _token);
}


// get all available ballots (as voter)
export const srv_getPublicBallots= async(objParam, _token) => {
  return srv_getRoute(API_PRIVATEROUTE+'voter/ballots', {    
    isOpenForRegistration: objParam.isOpenForRegistration,
    isOpenForVote: objParam.isOpenForVote,
    isOpenForStats: objParam.isOpenForStats,
  }, _token);
}

/*
 *    REQUIREMENTS
 */

// find a question
export const srv_getRequirements= async() => {
  return srv_getRoute(API_PUBLICROUTE+'viewer/ballot/requirements', {}, null);
}

/*
 *    QUESTIONS
 */

// create a question
export const srv_postCreateQuestion= async(objParam, _token) => {
  return srv_postRoute(API_PRIVATEROUTE+"designer/question", {
    title: objParam.title? encodeURIComponent(encodeURIComponent(objParam.title)): null,
    link: objParam.link? encodeURIComponent(encodeURIComponent(objParam.link)) : null,
    type: objParam.type? objParam.type: null,
    rich_text: objParam.rich_text? encodeURIComponent(encodeURIComponent(objParam.rich_text)): null,
    image: objParam.image? objParam.image: null
  }, _token);
}

// find a question
export const srv_findQuestion= async(objParam, _token) => {
  return srv_getRoute(API_PRIVATEROUTE+'designer/question/'+objParam.uid_question, {

  }, _token);
}

// update a question
export const srv_patchQuestion= async(objParam, _token) => {
  return srv_patchRoute(API_PRIVATEROUTE+'designer/question/'+objParam.uid_question, {    
    title: objParam.title? encodeURIComponent(encodeURIComponent(objParam.title)): null,
    link: objParam.link? encodeURIComponent(encodeURIComponent(objParam.link)) : null,
    type: objParam.type? objParam.type: null,
    rich_text: objParam.rich_text? encodeURIComponent(encodeURIComponent(objParam.rich_text)): null,
    image: objParam.image? objParam.image: null,
    aChoice: objParam.aChoice? encodeURIComponent(encodeURIComponent(objParam.aChoice)): null,
  }, _token);
}

// delete a question
export const srv_deleteQuestion= async(objParam, _token) => {
  return srv_deleteRoute(API_PRIVATEROUTE+'designer/question/'+objParam.uid_question, {    
  }, _token);
}

// add a question to a ballot
export const srv_linkQuestion= async(objParam, _token) => {
  return srv_linkRoute(API_PRIVATEROUTE+'designer/ballot/'+objParam.uid_ballot+"/question/"+objParam.uid_question, {    
  }, _token);
}

// remove a question from a ballot
export const srv_unlinkQuestion= async(objParam, _token) => {
  return srv_unlinkRoute(API_PRIVATEROUTE+'designer/ballot/'+objParam.uid_ballot+"/question/"+objParam.uid_question, {    
  }, _token);
}

/*
 *    VOTE
 */

// Vote on a ballot
export const srv_postVote= async(_uid, aProof, aVote, _token) => {
  return srv_postRoute(API_PRIVATEROUTE+'voter/ballot/'+_uid, {
    aProof: aProof,
    aVote: aVote
  }, _token);
}
