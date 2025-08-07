
/*
 *       Calls to Identus / Atala Prism agent / Proofs
 */

const srvIdentusUtils = require("./util_identus_utils");
const srvIdentusIdentity = require("../utils/util_identus_identity");
const srvIdentusCreds = require("../utils/util_identus_credentials");
const jwtDecode = require('jwt-decode');
const { consoleLog } = require("./util_services");

const STATUS_PROVER_PROOF_REQRECEIVED="RequestReceived";
const STATUS_PROVER_PROOF_SENT="PresentationSent";
const STATUS_HOLDER_PROOF_ACCEPTED="PresentationAccepted";

/*
 *       VC - Proof / Verification
 */

const getDecodedProof = function (item, _claim_type, _filterStatus) {

    let _claims = null;
    
    // happy with the challenge requested?
    const _options=(item.requestData? JSON.parse(item.requestData[0]).options : {});
    if(_options.challenge==_claim_type || _claim_type=="*") {

        hasSameType=true;

        if(_filterStatus===item.status || _filterStatus=="*") {
            const decoded_wrapper = item.data && item.data.length==1? jwtDecode(item.data[0]): null;
            if(decoded_wrapper) {
                const encoded_proof=decoded_wrapper.vp.verifiableCredential[0];
                const decoded_proof = jwtDecode(encoded_proof);
                const dateExpire = new Date(decoded_proof.exp * 1000);
                const now = new Date();
    //                        if(dateExpire> now) {              SHIT Identus expiry date does not work, so we cannot compare...
    
                    // now this must be the one 
                    if(decoded_proof.vc.credentialSubject && decoded_proof.vc.credentialSubject.claim_type==_claim_type || _claim_type=="*") {
                        isValid=true;
                        delete decoded_proof.vc.credentialSubject.id;
                        _claims=decoded_proof.vc.credentialSubject;
                        _claims.expire_at = dateExpire;
                    }
    //                        }
    
            }
        }
    }
    
    return _claims;
}

const async_getAllVCPresentationRequests = async function (objParam) {
    try {
        let _url="present-proof/presentations"+(objParam.thid? "?thid="+objParam.thid: "");
        let dataRet = await srvIdentusUtils.async_simpleGet(_url, objParam.key);

        // filter out with status?
        let _aRet=[];
        let _filterStatus = objParam.status? objParam.status : STATUS_PROVER_PROOF_SENT;     
        dataRet.data.forEach(item => {
            if(item.status == _filterStatus) {
                const _claims = getDecodedProof(item, objParam.claim_type, _filterStatus);
                _aRet.push({
                    claims: _claims,
                    claim_type: JSON.parse(item.requestData)?.options?.challenge,
                    proof: item.data && item.data.length==1? item.data[0]: null,   
                    thid: item.thid,
                    presentationId: item.presentationId,
                    status: item.status     
                });    
            }
        })
        return {data: _aRet}
    }
    catch(err) {throw err}
    
}

const async_getFirstHolderPresentationRequestMatchingType = async function (objParam) {
    try {
        // all requests received from holder point of view
        let aPresReceived = await async_getAllVCPresentationRequests({
            key: objParam.key,
        });

        // no request? Houston we have a problem... F@@# wait time not long enough or what else?
        if(aPresReceived.data && aPresReceived.data.length==0) {
            let dataDID = await srvIdentusIdentity.async_getDidForEntity({
                key: objParam.key,
            })
            throw({
                data:null,
                status: 404,
                statusText: "No presentation request received so far"+(objParam.thid? " (thid="+objParam.thid+")" : " for DID "+dataDID.data[0].did)
            })
        }

        // we need to check in all VC received by peer2, if one matches the proof request
        let _presId=null;
        let _proof=null;
        let _claims=null;
        let _thid=null;
        let _cVCAccepted=null;
        let isValid=false;
        let hasSameType=false;
        aPresReceived.data.forEach(item => {

            // filter through given status (if no status, only get those Proofs in a final state), but keep first mathing one if we have it
            let _filterStatus = objParam.status? objParam.status : STATUS_PROVER_PROOF_SENT;      
            if(_presId==null && item.status == _filterStatus) {
                _cVCAccepted++;

                _claims = getDecodedProof(item, objParam.claim_type, _filterStatus);
                _thid = item.thid;
                _presId = item.presentationId;
                _proof = item.data && item.data.length==1? item.data[0]: null;
            }
        })

        if(!_presId) {
            if(_cVCAccepted==0) {
                throw({
                    data:null,
                    status: 404,
                    statusText: "Holder does not hold any Proof yet"
                })    
            }
            if(!hasSameType) {
                throw({
                    data:null,
                    status: 404,
                    statusText: "No matching presentation for this proof request (type: "+objParam.claim_type+")"
                })    
            }
            if(!isValid) {
                throw({
                    data:null,
                    status: 404,
                    statusText: "All proofs have expired for this proof type ("+objParam.claim_type+")"
                })    
            }
        }

        return {data: {
            presentationId: _presId,
            thid: _thid,
            proof: _proof,
            claims: _claims
        }}
    }
    catch(err) {throw err}
}

const async_createVCPresentationRequest = async function (objParam) {
    try {

        let dataRet= await  srvIdentusUtils.async_simplePost("present-proof/presentations/", objParam.key, {
            connectionId: objParam.connection,
            proofs: objParam.proofs? objParam.proofs: [],
            options:{
                challenge: objParam.challenge,
                domain: objParam.domain
            },
            credentialFormat: "JWT"
        });
        consoleLog("Verifier issued a presentation request (thid="+dataRet.data.thid+ ")");
        return dataRet;
    }
    catch(err) {throw err}
}

// from holder point of view
const async_acceptVCPresentation = async function (objParam) {
    // patching presentation
    try {
        let dataRet= await srvIdentusUtils.async_simplePatch("present-proof/presentations/"+objParam.presentationId, objParam.key, {
            action: "request-accept",
            proofId: [objParam.recordId]
        });
        consoleLog("Prover accepts presentation request with record (thid="+dataRet.data.thid+ ")");
        return dataRet;
    }
    catch(err) {throw err}
}

// from verifier point of view
const async_issueVCProof = async function (objParam) {
    // patching presentation
    try {
        let dataRet= await srvIdentusUtils.async_simplePatch("present-proof/presentations/"+objParam.presentationId, objParam.key, {
            action: "presentation-accept"
        });
        consoleLog("Verifier presented proof (thid="+dataRet.data.thid+ ")");
        return dataRet;
    }
    catch(err) {throw err}
}

// from verifier point of view (includes holder actions)
const async_createCustodialProof = async function (objParam) {
    // we have a custodial context, we can do all in one go
    try {
        // if the proof already exists, we take it
        let dataExist=null;
        if(objParam.noDuplicate) {
            try {            
                dataExist= await async_getFirstHolderPresentationRequestMatchingType({
                    key: objParam.keyPeer2,
                    claim_type: objParam.claim_type,
                })

                if(dataExist.data && dataExist.data.claims) {
                    return dataExist;
                }
            }
            catch(err) {}
        }

        // is it already there but not accepted yet?
        let dataAPresReqAsHolder = await async_getAllVCPresentationRequests({
            key: objParam.keyPeer2,
            claim_type: objParam.claim_type,
            status: STATUS_PROVER_PROOF_REQRECEIVED
        })

        let dataPresReqAsVerifier=null;
        if(dataAPresReqAsHolder.data.length>0) {
            dataAPresReqAsHolder.data.forEach(_p => {
                if(_p.claim_type==objParam.claim_type) {
                    dataPresReqAsVerifier={data: _p};
                }
            })
        }        

        // we don t have any existing one.. so we request it
        if(!dataPresReqAsVerifier) {
            dataPresReqAsVerifier = await async_createVCPresentationRequest({
                key: objParam.keyPeer1,
                connection: objParam.connection,
                challenge: objParam.claim_type,
                domain: objParam.domain, 
            });

            // F@@# Identus will fail if called within less than 4, 5, or 6 secs after this call... oh my... we slow it down
            await srvIdentusUtils.wait(gConfig.identus.delay);
        }

        let dataPresReqAsHolder = await async_getAllVCPresentationRequests({
            key: objParam.keyPeer2,
            thid: dataPresReqAsVerifier.data.thid,
            status: STATUS_PROVER_PROOF_REQRECEIVED
        })

        let objBestMatchRecord=null;
        
        // force selection of a specific creds?
        if (objParam.thid) {
            let _a = await srvIdentusCreds.async_getAllVCOffers({
                key: objParam.keyPeer2,
                thid: objParam.thid,
            })
            if (_a && _a.data && _a.data.length==1) {
                objBestMatchRecord=_a.data[0];
            }
        }

        // no creds found or forced? select best match
        if(!objBestMatchRecord) {
            let dataBestMatchRecord = await srvIdentusCreds.async_getFirstHolderVCMatchingType({
                key: objParam.keyPeer2,
                claim_type: objParam.claim_type
            })  
            objBestMatchRecord=dataBestMatchRecord.data;
        }

        let dataAccept = await async_acceptVCPresentation({
            key: objParam.keyPeer2,
            presentationId: dataPresReqAsHolder.data[0].presentationId,
            recordId: objBestMatchRecord.recordId
        });

        // F@@# Identus will fail if called within less than 4, 5, or 6 secs after this call... oh my... we slow it down
        // !!! double wait for the Proof issuance (or it fails too often)
        await srvIdentusUtils.wait(gConfig.identus.delay);
        await srvIdentusUtils.wait(gConfig.identus.delay);

        let dataProof= await async_issueVCProof({
            key: objParam.keyPeer1,
            presentationId: dataPresReqAsVerifier.data.presentationId,
        });

        const decoded_wrapper = jwtDecode(dataProof.data.data[0]);
        const encoded_proof=decoded_wrapper.vp.verifiableCredential[0];
        const decoded_proof = jwtDecode(encoded_proof);
        delete decoded_proof.vc.credentialSubject.id;
        return {
            data: {
                wasPresented: true,
                wasAccepted: true,
                thid: dataProof.data.thid,
                proof: dataProof.data.data[0],
                claims: decoded_proof.vc.credentialSubject
            }
        }
    }
    catch(err) {throw err}
}



module.exports = {
    STATUS_PROVER_PROOF_SENT,
    STATUS_PROVER_PROOF_REQRECEIVED,
    async_createVCPresentationRequest,
    async_getAllVCPresentationRequests,
    async_getFirstHolderPresentationRequestMatchingType,
    async_acceptVCPresentation,
    async_issueVCProof,
    async_createCustodialProof
}