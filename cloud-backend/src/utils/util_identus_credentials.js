
/*
 *       Calls to Identus / Atala Prism agent / Credentials
 */

const srvIdentusUtils = require("./util_identus_utils");
const { consoleLog } = require("./util_services");

const STATUS_HOLDER_CREDSRECEIVED="CredentialReceived";
const STATUS_HOLDER_OFFERRECEIVED="OfferReceived";
const STATUS_HOLDER_REQUESTSENT="RequestSent";

/*
 *       VC - Offer / Accept / Issue
 */

const async_createVCOfferWithoutSchema = async function (objParam) {
    try {
        // ensure claim is in JSON format 
        if (typeof objParam.claims === "string") {
            try {
                objParam.claims = JSON.parse(objParam.claims);
            } catch (error) {
                objParam.claims={}
            }
        }
        
        let dataRet = await srvIdentusUtils.async_simplePost("issue-credentials/credential-offers/", objParam.key, {
            "validityPeriod": objParam.validity,
            "schemaId": null,
    //        "schemaId": objParam.location,
    //        "credentialDefinitionId": objParam.definition,
            "credentialFormat": "JWT",
            "claims": objParam.claims,
            "automaticIssuance": false,
            "issuingDID": objParam.author,
            "connectionId": objParam.connection
        });
        consoleLog("Issuer issued a new offer (thid="+dataRet.data.thid+ ")");
        return dataRet;
    }
    catch (err) {throw err}
    return 
}

// get all offers issued by this peer (can be pending, accpted, issued...)
const async_getAllVCOffers = async function (objParam) {
    return srvIdentusUtils.async_simpleGet("issue-credentials/records"+(objParam.thid? "?thid="+objParam.thid: ""), objParam.key);
}

// get a specific offer issued by this peer (can be pending, accpted, issued...)
const async_getVCOffer = async function (objParam) {
    return srvIdentusUtils.async_simpleGet("issue-credentials/records/"+objParam.recordId, objParam.key);
}

const async_acceptVCOffer = async function (objParam) {
    try {
        let dataRet = await srvIdentusUtils.async_simplePost("issue-credentials/records/"+objParam.recordId+"/accept-offer", objParam.key, {
            subjectId: objParam.did
        })
        consoleLog("Holder accepted creds offer (thid="+dataRet.data.thid+ ")");
        return dataRet;
    }
    catch (err) {throw err}
}

const async_issueVC = async function (objParam) {
    try {
        let dataRet = await srvIdentusUtils.async_simplePost("issue-credentials/records/"+objParam.recordId+"/issue-credential", objParam.key, {
            // todo : put param here
        })
        consoleLog("Issuer issued a VC (thid="+dataRet.data.thid+ ")");
        return dataRet;
    }
    catch (err) {throw err}
}

const async_getFirstHolderVCMatchingType = async function (objParam) {
    try {
        // all requests received from holder point of view
        let aVCReceived = await async_getAllVCOffers({
            key: objParam.key,
        });

        // no request? Houston we have a problem... F@@# wait time not long enough or what else?
        if(aVCReceived.data && aVCReceived.data.length==0) {
            let dataDID = await srvIdentusIdentity.async_getDidForEntity({
                key: objParam.key,
            })
            throw({
                data:null,
                status: 404,
                statusText: "No VC received so far"+(objParam.thid? " (thid="+objParam.thid+")" : " for DID "+dataDID.data[0].did)
            })
        }
        // we need to check in all VC received by peer2, if one matches the claim
        let _thid=null;
        let _recId=null;
        let _vc=null;
        let _status = null;
        let _cVCAccepted=null;
        let isValid=false;
        let hasSameType=false;
        aVCReceived.data.forEach(item => {

            // filter through given status (if no status, only get those Proofs in a final state), but keep first mathing one if we have it
            let _filterStatus = objParam.status? objParam.status : STATUS_HOLDER_CREDSRECEIVED;      
            if(_recId==null && (item.protocolState == _filterStatus || _filterStatus=="*")) {
                _cVCAccepted++;

                // happy with the challenge requested?
                if(item.claims && item.claims.claim_type &&  item.claims.claim_type==objParam.claim_type) {
                    _recId=item.recordId;
                    _thid=item.thid;
                    _status = item.protocolState;
                    _vc=item;
                    hasSameType=true;
                }
            }
        })

        if(!_recId) {
            if(_cVCAccepted==0) {
                throw({
                    data:null,
                    status: 404,
                    statusText: "Holder does not hold any VC yet"
                })    
            }
            if(!hasSameType) {
                throw({
                    data:null,
                    status: 404,
                    statusText: "No matching VC for this proof request (type: "+objParam.claim_type+")"
                })    
            }
        }

        return {data: {
            recordId: _recId,
            thid: _thid,
            status: _status,
            vc: _vc
        }}
    }
    catch(err) {throw err}
}

// custodial full issuance (with issuer and holder actions) 
const async_createCustodialCredential = async function (objParam) {
    try {
        // data check
        if(!objParam.didPeer1 || !objParam.didPeer2 || !objParam.keyPeer1 || !objParam.keyPeer2 || !objParam.connection || !objParam.claims) {
            throw({
                data:null,
                status: 400,
                statusText: "Bad data for creation of custodial Creds"
            })
        }
        // we have a custodial context, we can do all in one go

        // ensure claim is in JSON format 
        if (typeof objParam.claims === "string") {
            try {
              objParam.claims = JSON.parse(objParam.claims);
            } catch (error) {
                objParam.claims={}
            }
        }

        // look if we have a similar valid creds (do not issue a new exact same one if a valid creds exist)
        let dataExist=null;
        if(objParam.noDuplicate && objParam.claims && objParam.claims.claim_type) {
            try {
                dataExist= await async_getFirstHolderVCMatchingType({
                    key: objParam.keyPeer2,
                    claim_type: objParam.claims.claim_type,
                    status: STATUS_HOLDER_CREDSRECEIVED
                });
                return dataExist;
            }
            catch(err) {}
        }

        // no received offer...  were we stuck in a pending offer not validated?
        let _recordIdIssuer=null;
        let _recordIdHolder=null;
        let _thid=null;
        let _status=null;
        try {
            dataExist= await async_getFirstHolderVCMatchingType({
                key: objParam.keyPeer2,
                claim_type: objParam.claims.claim_type,
                status: "*"
            });

            // we have something...
            _recordIdHolder=dataExist.data.recordId;
            _thid=dataExist.data.thid;
            _status=dataExist.data.status;

            // we want the recordID viewpoint of issuer
            const dataIssuer= await async_getAllVCOffers({
                key: objParam.keyPeer1,
                thid: _thid
            });
            dataIssuer.data.forEach(item => {
                if(item.thid===_thid) {
                    _recordIdIssuer=item.recordId;
                }
            })  
        }
        catch(err) {}

        // create an offer
        if(!dataExist || dataExist.data==null) {
            let dataOfferByIssuer= await async_createVCOfferWithoutSchema({
                connection: objParam.connection,
                validity: objParam.validity,
                key: objParam.keyPeer1,
                author: objParam.didPeer1,
                claims: objParam.claims
            });
            _recordIdIssuer=dataOfferByIssuer.data.recordId;
                
            // F@@# Identus will fail if called within less than 4, 5, or 6 secs after this call... oh my... we slow it down
            await srvIdentusUtils.wait(gConfig.identus.delay);

            // get offer record from holder point of view
            let dataOfferedToHolder= await async_getAllVCOffers({
                key: objParam.keyPeer2,
                thid: dataOfferByIssuer.data.thid
            });

            // we should have only one in the array
            dataOfferedToHolder.data.forEach(item => {
                if(item.thid===dataOfferByIssuer.data.thid) {
                    _recordIdHolder=item.recordId;
                    _thid=dataOfferByIssuer.data.thid;
                    _status=STATUS_HOLDER_OFFERRECEIVED;          
                }
            })  
        }

        if(!_recordIdHolder || !_recordIdIssuer) {
            throw({
                data:null,
                status: 404,
                statusText: "Offer just issued by issuer cannot be found by holder after a delay of "+(gConfig.identus.delay/1000)+ " secs"
            })
        }

        // ask the AI to accept this offer (with its own recordId)
        if(_status==STATUS_HOLDER_OFFERRECEIVED) {
            let dataAcceptedByHolder= await async_acceptVCOffer({
                key: objParam.keyPeer2,
                recordId: _recordIdHolder,
                did: objParam.didPeer2
            });    
        }

        // F@@# Identus will fail if called within less than 4, 5, or 6 secs after this call... oh my... we slow it down
        await srvIdentusUtils.wait(gConfig.identus.delay);

        // now issue the VC
        let dataVCByIssuer=await async_issueVC({
            key: objParam.keyPeer1,
            recordId: _recordIdIssuer
        })        

        // F@@# Identus will fail if called within less than 4, 5, or 6 secs after this call... oh my... we slow it down
        await srvIdentusUtils.wait(gConfig.identus.delay);

        // get the proof (as per holder)
        let dataVCToHolder= await async_getAllVCOffers({
            key: objParam.keyPeer2,
            thid: _thid
        });

        return {
            data: {
                wasOffered: true,
                wasAccepted: true,
                vc: dataVCToHolder.data[0]
            }
        }
    }
    catch (err) {throw err}
}

module.exports = {
    async_createVCOfferWithoutSchema,
    async_getAllVCOffers,
    async_getVCOffer,
    async_acceptVCOffer,
    async_issueVC,
    async_getFirstHolderVCMatchingType,
    async_createCustodialCredential
}