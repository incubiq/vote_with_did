const fs = require("fs");
const path = require('path');
const apiBase = require('./base_publicApi_base');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');

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
            if(objUpdate.settings) {objUpd.settings_admin = objUpdate.settings}

            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: objParam.uid
            }, objUpd);
            
            return {data: objUpdB};
        }
        catch(err) {
            throw err;
        }
    }

    async async_addOrEditQuestion(objParam) {
        try {
            if(!objParam.canAddQuestion)  {
                throw {
                    data:null,
                    status: 401,
                    statusText: "No rights to add or edit a question"    
                }
            }

            // get this ballot 
            let dataBallot = await this.async_findBallotForDesigner({
                did: objParam.did,
                uid: objParam.uid_ballot
            });

            let _aQ=[...dataBallot.data.aQuestion];
            if(objParam.uid_question) {
                const i=_aQ.findIndex(function (x) {return x===objParam.uid_question});
                if(i!=-1) {
                    // edit
                    if(objParam.title) {_aQ[i].title = objParam.title}
                    if(objParam.rich_text) {_aQ[i].rich_text = objParam.rich_text}
                    if(objParam.link) {_aQ[i].link = objParam.link}
                    if(objParam.image) {_aQ[i].image = objParam.image}
                    if(objParam.type) {_aQ[i].type = objParam.type}
                    if(objParam.aChoice) {_aQ[i].aChoice = objParam.aChoice}
                }
            }
            else {
                // add
                let dataQ = await this.async_createQuestion(objParam);
                if (dataQ.data) {
                    _aQ.push(dataQ.data);
                }
            }

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

    async async_removeQuestion(objParam) {
        try {
            if(!objParam.canAddQuestion)  {
                throw {
                    data:null,
                    status: 401,
                    statusText: "No rights to remove a question"    
                }
            }

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

    async _async_findMyBallot(objParam) {
        try {
            if(!objParam.did) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "DID required"    
                }
            }

            let objBallot=await this.dbBallot.async_findBallot({
                uid: objParam.uid
            });

            if(!objBallot) {
                throw {
                    data: null,
                    status: 404,
                    statusText: "No ballot with uid "+uid
                }
            }
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

    async async_getMyBallots(objParam) {
        try {
            let aB=await this.dbBallot.async_getBallots({
                did_admin: objParam.did
            }, {}, []);

            return {data : aB}
        }
        catch(err) {
            throw err;
        }
    }

    async async_prepublishBallot(objParam, objVoid) {
        try {
            // get this ballot
            let dataBallot = await this.async_findBallotForDesigner({
                uid: objParam.uid,
                did: objParam.did
            });

            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: dataBallot.data.uid
            }, {
                prepublished_at: new Date(new Date().toUTCString()),
                is_open: false,  
                is_closed: false  
            });

            return  {data: objUpdB}
        }
        catch(err) {
            throw err;
        }
    }
    
    async async_publishBallot(objParam, objVoid) {
        try {
            // get this ballot
            let dataBallot = await this.async_findMyBallot({
                uid: objParam.uid,
                did: objParam.did
            });

            let objUpdB=await this.dbBallot.async_updateBallot({
                uid: dataBallot.data.uid
            }, {
                published_at: new Date(new Date().toUTCString()),
                opening_at: new Date(new Date().toUTCString()),     // todo 
                closing_at: new Date(new Date().toUTCString()),     // todo 
                published_id: 1,         // todo
                is_open: false,  
                is_closed: false  
            });

            return  {data: objUpdB}
        }
        catch(err) {
            throw err;
        }
    }

    async async_getMatchingBallots(objFilter, aMatch) {
        try {
            let aB=await this.dbBook.async_getBallots({
            }, objFilter, aMatch);

            return {data : aB}
        }
        catch(err) {
            throw err;
        }
    }

    async async_getPubliclyAvailableBallots() {
        return this.async_getMatchingBallots({
            filterPaging: {
                limit: 100
            }, 
            filterSort: {
                sortby: "opening_at",
                sortDirection: -1
            }
        }, [{
            $match: {
                $expr: {
                    $and : [
                        { $or: [ { $eq: ["$is_open", true] }, { $eq: ["$is_closed", false] } ] },
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
                    sortby: "closing_at",
                    sortDirection: -1
                }
            }, [{
                $match: {
                    $eq: ["$is_closed", true]  
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
                    username: objParam.username,
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

    async async_createQuestion(objParam)  {
        try {
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

            if(objParam.type=="bool" && (!objParam.aChoice || objParam.aChoice.length==0)) {
                objParam.aChoice=[{text: "yes", value: true}, {text: "no", value: false}]
            }
            if(objParam.aChoice) {objCreate.aChoice=objParam.aChoice}

            const objQ=await this.dbQuestion.async_createQ(objCreate);
            return {data: objQ}
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