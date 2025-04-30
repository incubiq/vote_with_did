const fs = require("fs");
const path = require('path');
const utilServices = require('../utils/util_services');
const cEvents = require('../const/const_events');

/*   
 *      Questions
 */

class eng_question {

    constructor(objParam) {
        const classDBQ = require('../dbaccess/db_question');
        this.dbQ=new classDBQ({stdTTL: 864000});   // 10 day cache...
    }

    async async_createQuestion(objParam) {
        try {
            if(!objParam.did) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "DID required"    
                }
            }
            if(!objParam.title) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "title required"    
                }
            }
            if(!objParam.rich_text) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "text required"    
                }
            }
            if(!objParam.type) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "type"    
                }
            }
            if(!objParam.aChoice) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "choices required"    
                }
            }

            let objQ=await this.dbQ.async_create({
                did_designer: objParam.did,
                title: objParam.title,
                rich_text: objParam.rich_text,
                image: objParam.image,
                link: objParam.link,
                type: objParam.type,
                aChoice: objParam.aChoice,
            });


            // track question create event
            try{
                this.dbEvent.async_createEvent({
                    username: objParam.did,
                    type: cEvents.EVENT_QUESTION_CREATED.value,
                    value: JSON.stringify({
                        title: objQ.title, 
                        uid: objQ.uid
                    })
                });    
            }
            catch(err){}

            return {data : objBallot}
        }
        catch(err) {
            throw err;
        }
    }

    async async_updateQuestion(objParam, objUpdate) {
        try {

             // get this question 
             let dataQuestion = await this.async_findQuestionForDesigner({
                uid: objParam.uid,
                a_did_designer: [objParam.did]
            });
            
            // upd
            let objUpdQ=await this.dbQ.async_update({
                uid: objParam.uid
            }, objUpdate);
            
            return objUpdQ; 
        }
        catch(err) {
            throw err;
        }
    }
    
    async _async_findQuestion(objParam) {
        try {
            if(!objParam.uid) {
                throw {
                    data:null,
                    status: 400,
                    statusText: "UID required"    
                }
            }

            let objQ=await this.dbQ.async_find({
                uid: objParam.uid
            });

            if(!objQ) {
                throw {
                    data: null,
                    status: 404,
                    statusText: "No question with uid "+uid
                }
            }
            return objQ;  
        }
        catch(err) {
            throw err;
        }
    }

    // public view of the question
    async async_findQuestion(objParam) {
        try {
            let objQ=await this._async_findQuestion(objParam);
            delete objQ.did_designer;
            return objQ;
        }
        catch(err) {
            throw err;
        }
    }
    
    // designer view of the question (for update)
    async async_findQuestionForDesigner(objParam) {
        try {
            let objQ = this._async_findQuestion(objParam);
            if(!objParam.a_did_designer.includes(objQ.did_designer)) {
                throw {
                    data: null,
                    status: 403,
                    statusText: "No edit access right to this Question"
                }
            }
            return {data: objQ};
        }
        catch(err) {
            throw err;
        }
    }

    async async_getMyQuestions(objParam) {
        try {
            let aQ=await this.dbQ.async_getQuestions({
                did_designer: objParam.did
            }, {}, []);

            return {data : aQ}
        }
        catch(err) {
            throw err;
        }
    }

    async async_deleteQuestion(objParam) {
        try{
            let dataQ = await this.async_findQuestionForDesigner(objParam);
            let _obj=await this.dbQ.async_delete({
                uid: objParam.uid,
                hardDelete : (objParam.hardDelete==true)
            });

            // track book delete event
            try{
                this.dbEvent.async_createEvent({
                    username: objParam.did,
                    type: cEvents.EVENT_QUESTION_DELETED.value,
                    value: JSON.stringify({
                        title: dataQ.data.title, 
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

module.exports = eng_question;