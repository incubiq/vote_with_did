const crypto = require('crypto');
const {ed25519} = require('@noble/curves/ed25519');
const fs = require("fs");
const path = require('path');
const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');
const cUsers = require('../const/const_users');
const cClaims = require('../const/const_claims');
const {async_createAndPublishDidForBallot} = require('../utils/util_identus_identity');

/*   
 *      Ballot APIs
 */

class api_ballot extends apiBase {

    constructor(objParam) {
        super(objParam); // need to call the parent constructor when inheriting

        const classDBBallot = require('../dbaccess/db_ballot');
        this.dbBallot=new classDBBallot({stdTTL: 864000});   // 10 day cache...

        const classDBQuestion = require('../dbaccess/db_question');
        this.dbQuestion=new classDBQuestion({stdTTL: 864000});   // 10 day cache...
    }

/*   
 *      Ballot
 */

    async async_createBallot(objParam) {
        try {
            if(!objParam.did) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "admin required"    
                }
            }
            if(!objParam.name) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "name required"    
                }
            }

            let objB=await this.dbBallot.async_createBallot({
                did_admin: objParam.did,
                name: objParam.name
            });

            if(!objB) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "Could not create Ballot"    
                }
            }

            // track ballot create event
            try{
                this.dbEvent.async_createEvent({
                    username: objParam.did,
                    type: cEvents.EVENT_BALLOT_CREATED.value,
                    value: JSON.stringify({
                        name: objB.name, 
                        uid: objB.uid
                    })
                });    
            }
            catch(err){}

            return {data : objB}
        }
        catch(err) {
            throw err;
        }
    }

    // has the user rights to edit the ballot?
    canEditBallot(objBallot, _did) {
        // either a designer or an admin
        return (objBallot && (objBallot.a_did_designer.includes(_did) || objBallot.did_admin==_did));
    }

    async async_updateBallotByAdmin(objParam, objUpdate) {
        try {

             // get this ballot 
             let dataBallot = await this.async_findMyBallot({
                did: objParam.did,
                uid: objParam.uid
            });
            
            // upd
            let objUpd = {};
            if(objUpdate.name) {objUpd.name = objUpdate.name}
            if(objUpdate.opening_at) {objUpd.opening_at = objUpdate.opening_at}
            if(objUpdate.closing_at) {objUpd.closing_at = objUpdate.closing_at}

            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: objParam.uid
            }, objUpd);
            
            return {data: objUpdB};
        }
        catch(err) {
            throw err;
        }
    }

    async async_linkQuestion(objParam) {
        try {
            // get this question 
            let objQ = await this._async_findQuestion({
                uid: objParam.uid_question,
                canAddQuestion: objParam.canAddQuestion
            });

            // get this ballot 
            let dataBallot = await this.async_findBallotForDesigner({
                did: objParam.did,
                uid: objParam.uid_ballot
            });

            let _aQ=[...dataBallot.data.aQuestion];
            _aQ.push(objParam.uid_question)

            // update ballot with question
            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: objParam.uid_ballot
            }, {
                aQuestion: _aQ
            });

            return {data: objUpdB};
        }
        catch(err) {
            throw err;
        }
    }
    
    async async_unlinkQuestion(objParam) {
        try {
            // get this question 
            let objQ = await this._async_findQuestion({
                uid: objParam.uid_question,
                canAddQuestion: objParam.canAddQuestion
            });

            // get this ballot 
            let dataBallot = await this.async_findBallotForDesigner({
                did: objParam.did,
                uid: objParam.uid_ballot
            });

            // remove question
            let _aQ=[...dataBallot.data.aQuestion];
            const i=_aQ.findIndex(function (x) {return x===objParam.uid_question});
            if(i!=-1) {
                _aQ.splice(i, 1);
            }
            else {
                throw  {
                    data:null,
                    status: 404,
                    statusText: "Question not found in ballot (Q uid:"+objParam.uid_question+")"
                } 
            }

            // update ballot
            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: objParam.uid_ballot
            }, {
                aQuestion: _aQ
            });

            return {data: objUpdB};
        }
        catch(err) {
            throw err;
        }
    }

    async _async_findBallot(objParam) {
        try {

            let objBallot=await this.dbBallot.async_findBallot({
                uid: objParam.uid
            });

            if(!objBallot) {
                throw {
                    data: null,
                    status: 404,
                    statusText: "No ballot with uid "+objParam.uid
                }
            }

            // load all questions
            let _aQ=[];
            for (var i=0; i<objBallot.aQuestion.length; i++) {
                const objQ = await this._async_findQuestion({
                    canAddQuestion: true,
                    uid:  objBallot.aQuestion[i]
                })
                _aQ.push(objQ);
            }
            objBallot.aQuestionInFull = _aQ;

            // check open/close 
            const now = new Date();
            objBallot.is_closedToRegistration= new Date(objBallot.closingRegistration_at) < now;
            objBallot.is_openedToRegistration= !objBallot.is_closedToRegistration && new Date(objBallot.openingRegistration_at) < now;
            objBallot.is_closedToVote= new Date(objBallot.closingVote_at) < now;
            objBallot.is_openedToVote= objBallot.is_closedToRegistration && !objBallot.is_closedToVote && new Date(objBallot.openingVote_at) < now;

            return objBallot;  
        }
        catch(err) {
            throw err;
        }
    }

    async _async_findMyBallot(objParam) {
        try {
            if(!objParam.did) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "DID required"    
                }
            }

            let objBallot=await this._async_findBallot({
                uid: objParam.uid
            });

            return objBallot;  
        }
        catch(err) {
            throw err;
        }
    }

    async async_findMyBallot(objParam) {
        try {
            let objBallot = await this._async_findMyBallot(objParam);
            if(objBallot.did_admin!==objParam.did) {
                throw {
                    data: null,
                    status: 403,
                    statusText: "Not your Ballot"
                }
            }
            return {data: objBallot};
        }
        catch(err) {
            throw err;
        }
    }

    async async_findBallotForDesigner(objParam) {
        try {
            let objBallot = await this._async_findMyBallot(objParam);

            // if admin, do not bother with designer
            if(objBallot.did_admin==objParam.did) {
                return {data: objBallot};
            }
            if(!objBallot.a_did_designer || !objBallot.a_did_designer.includes(objParam.did)) {
                throw {
                    data: null,
                    status: 403,
                    statusText: "No design access to this Ballot"
                }
            }
            return {data: objBallot};
        }   
        catch(err) {
            throw err;
        }
    }

    async async_findBallotForVoter(objParam) {
        try {
            let objBallot = await this._async_findBallot(objParam);

            // needs to be open for vote
            if(!objBallot.is_openedToVote) {
                throw {
                    data: null,
                    status: 403,
                    statusText: "Ballot not opened for vote"
                }
            }
            return {data: objBallot};
        }   
        catch(err) {
            throw err;
        }
    }

    async async_getMyBallots(objParam) {
        try {
            let aB=await this.dbBallot.async_getBallots({
                did_admin: objParam.did
            }, {}, []);

            // return ballots with all info in full
            let _aRet=[];
            for (var iB=0; iB<aB.length; iB++) {
                
                // load all questions
                const dataB = await this.async_findMyBallot({
                    uid: aB[iB].uid,
                    did: objParam.did
                })
                _aRet.push(dataB.data);
            }

            return {data : _aRet}
        }
        catch(err) {
            throw err;
        }
    }

    getUniqueBallotKeys(objParam) {
        const keyUser=cUsers.getUserFromDid(objParam.did);
        const info = `ballot:${objParam.uid_ballot}:${objParam.published_at}`;
        const hmac = crypto.createHmac('sha256', keyUser);
        hmac.update(info);
        const seed = hmac.digest();
        const priv = seedBallot.slice(0, 32);
        return {
            private: priv,
            public: ed25519.getPublicKey(priv)
        };
    }

    async async_publishBallot(objParam, objOpenClose) {
        try {

            // get this ballot
            let dataBallot = await this.async_findBallotForDesigner({
                uid: objParam.uid,
                did: objParam.did
            });

            let objUpd={
                published_at: new Date(new Date().toUTCString()),
                published_id: 1,         // todo
            };
            if(objOpenClose.openingRegistration_at) {objUpd.openingRegistration_at=objOpenClose.openingRegistration_at}
            if(objOpenClose.closingRegistration_at) {objUpd.closingRegistration_at=objOpenClose.closingRegistration_at}
            if(objOpenClose.openingVote_at) {objUpd.openingVote_at=objOpenClose.openingVote_at}
            if(objOpenClose.closingVote_at) {objUpd.closingVote_at=objOpenClose.closingVote_at}
            if(objOpenClose.requirement) {
                let aExtra = objOpenClose.extra? objOpenClose.extra : [];
                objUpd.aCreds={
                    type: objOpenClose.requirement,
                    extra: aExtra 
                }}
            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: dataBallot.data.uid
            }, objUpd);

            // get it with all extra data
            const objB = await this._async_findMyBallot({
                uid: objParam.uid,
                did: objParam.did
            });

            // now publish as DID
            const ballotKeys=this.getUniqueBallotSeed({
                did: objParam.did,
                uid_ballot: objParam.uid,
                published_at: objUpdB.published_at
            })

            // get questions anon data
            let _aQ=[];
            objB.aQuestionInFull.forEach(q => {
                _aQ.push({
                    title: q.title,
                    content: q.rich_text.substring(0, 30)+(q.rich_text.length>30? "...": ""),
                    aChoice: q.aChoice
                })
            });

            // now create a DID with those keys, and set the services            
            const pubBallot = await async_createAndPublishDidForBallot({
                title: objB.title,
                closingRegistration_at: objB.closingRegistration_at,
                closingVote_at: objB.closingVote_at,
                openingRegistration_at: objB.openingRegistration_at,
                openingVote_at: objB.openingVote_at,
                aQ: _aQ,
                aReq: objB.aCreds
            }) 
            
            // store longDID as ballot published ID
            objUpdB=await this.dbBallot.async_updateBallot({
                uid: dataBallot.data.uid
            }, {
                published_id: pubBallot.data.longDid
            });

            // get it with all extra data
            objB = await this._async_findMyBallot({
                uid: objParam.uid,
                did: objParam.did
            });

            return  {data: objB}
        }
        catch(err) {
            throw err;
        }
    }
    
    async async_getMatchingBallots(objFilter, aMatch) {
        try {
            let aB=await this.dbBallot.async_getBallots({
            }, objFilter, aMatch);

            let _aRet=[];
            for (var iB=0; iB<aB.length; iB++) {
                const objB = await this._async_findBallot({
                    uid: aB[iB].uid,
                })
                _aRet.push(objB);
            }

            return {data : _aRet}
        }
        catch(err) {
            throw err;
        }
    }

    async async_getPubliclyAvailableBallotsForRegistration() {
        const now = new Date();
        return this.async_getMatchingBallots({
            filterPaging: {
                limit: 100
            }, 
            filterSort: {
                sortby: "openingRegistration_at",
                sortDirection: -1
            }
        }, [{
            $match: {
                $expr: {
                    $and : [
                        { $lt: ["$openingRegistration_at", now] }, // opened (past)
                        { $gt: ["$closingRegistration_at", now] }  // not closed yet (future)
                    ]
                }
            }
        }]);
    }

    async async_getPubliclyAvailableBallotsForVoting() {
        const now = new Date();
        return this.async_getMatchingBallots({
            filterPaging: {
                limit: 100
            }, 
            filterSort: {
                sortby: "openingVote_at",
                sortDirection: -1
            }
        }, [{
            $match: {
                $expr: {
                    $and : [
                        { $lt: ["$openingVote_at", now] }, // opened (past)
                        { $gt: ["$closingVote_at", now] }  // not closed yet (future)
                    ]
                }
            }
        }]);
    }

    async async_getPubliclyAvailableBallotsForStats() {
        const now = new Date();
        return this.async_getMatchingBallots({
            filterPaging: {
                limit: 100
            }, 
            filterSort: {
                sortby: "closingVote_at",
                sortDirection: -1
            }
        }, [{
            $match: {
                $expr: {
                    $and : [
                        { $eq: ["$published_at", null] },  // not yet published
                        { $lt: ["$closingVote_at", now] }  // closed 
                    ]
                }
            }
        }]);
    }

    async async_getClosedBallots() {
        return this.async_getMatchingBallots({
                filterPaging: {
                    limit: 100
                }, 
                filterSort: {
                    sortby: "closingVote_at",
                    sortDirection: -1
                }
            }, [{
                $match: {
                    $eq: ["$is_closedToVote", true]  
                }
            }]
        );
    }

    async async_deleteBallot(objParam) {
        try{
            let dataBallot = await this.async_getMyBallots(objParam);
            let _obj=await this.dbBallot.async_delete({
                uid: objParam.uid,
                hardDelete : (objParam.hardDelete==true)
            });

            // track book delete event
            try{
                this.dbEvent.async_createEvent({
                    username: objParam.username? objParam.username : "unknown user",
                    type: cEvents.EVENT_BALLOT_DELETED.value,
                    value: JSON.stringify({
                        name: dataBallot.data.name, 
                        uid: objParam.uid
                    })
                });    
            }
            catch(err){}
            return {data: null}
        }
        catch (err) {
            throw err;
        }
    }

/*   
 *      Question APIs
 */

/*   
 *      Questions
 */

    async async_createQuestion(objParam)  {
        try {
            if(!objParam.canAddQuestion)  {
                throw {
                    data:null,
                    status: 401,
                    statusText: "No rights to create a question"    
                }
            }

            if(!objParam.title || !objParam.type || !objParam.did) {
                throw {
                    data: null,
                    status: 400,
                    statusText: "Cannot create question without title or type"
                }
            }

            let objCreate = {
                type: objParam.type, 
                title: objParam.title,
                did_designer: objParam.did,
                rich_text: "awaiting content"
            }

            if(objParam.rich_text) {objCreate.rich_text=objParam.rich_text} 
            if(objParam.link) {objCreate.link=objParam.link}
            if(objParam.image) {objCreate.image=objParam.image}
            if(objParam.aChoice) {objCreate.aChoice=objParam.aChoice}

            const objQ=await this.dbQuestion.async_createQ(objCreate);
            return {data: objQ}
        }
        catch(err) {
            throw err;
        }
    }

    async _async_findQuestion(objParam) {
        try {
            if(!objParam.canAddQuestion)  {
                throw {
                    data:null,
                    status: 401,
                    statusText: "No rights to add/update a question"    
                }
            }

            // get this question 
            let objQ = await this.dbQuestion.async_findQ({
                uid: objParam.uid,
            });

            if(!objQ)  {
                throw {
                    data:null,
                    status: 404,
                    statusText: "No question with uid "+objParam.uid    
                }
            }

            return objQ;
        }
        catch(err) {
            throw err;
        }
    }

    async async_findQuestion(objFind) {
        try {
            // get this question 
            let objQ = await this._async_findQuestion({
                uid: objFind.uid,
                canAddQuestion: objFind.canAddQuestion
            });

            return {data: objQ};
        }
        catch(err) {
            throw err;
        }
    }

    async async_updateQuestion(objFind, objUpdate) {
        try {
            // get this question 
            let objQ = await this._async_findQuestion({
                uid: objFind.uid,
                canAddQuestion: objFind.canAddQuestion
            });

            let bHasTypeChanged = false;
            if(objUpdate.title) {objQ.title = objUpdate.title}
            if(objUpdate.rich_text) {objQ.rich_text = objUpdate.rich_text}
            if(objUpdate.link) {objQ.link = objUpdate.link}
            if(objUpdate.image) {objQ.image = objUpdate.image}
            if(objUpdate.type) {
                bHasTypeChanged= objQ.type != objUpdate.type;
                objQ.type = objUpdate.type;
            }

            // remove prev choice if type was changed
            if(bHasTypeChanged && objQ.aChoice.length>0) {
                objUpdate.aChoice=[];
            }
            // (but) set it to new if provided
            if(objUpdate.aChoice) {objQ.aChoice = objUpdate.aChoice}

            // update question
            let objUpQ=await this.dbQuestion.async_updateQ({
                uid: objFind.uid
            }, objQ);

            return {data: objUpQ};
        }
        catch(err) {
            throw err;
        }
    }

    async async_deleteQuestion(objParam) {
        try {
            // get this question 
            let objQ = await this._async_findQuestion({
                uid: objParam.uid,
                canAddQuestion: objParam.canAddQuestion
            });

            // remove question from DB
            await this.dbQuestion.async_deleteQ({
                uid: objParam.uid
            }) 

            return {data: null};
        }
        catch(err) {
            throw err;
        }
    }

/*
 *  Public APIs   
 */

    async async_findBallotBy(objParam)  {
        try {

            let aB=await this.dbBallot.async_getBallots({}, {}, [{
                "$match": {
                    // todo
                    }
                }]);

            return {data: aB}
        }
        catch(err) {
            throw err;
        }
    }
}

module.exports = api_ballot;