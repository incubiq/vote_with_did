
const EVENT_UNKNOWN={
    value: 0,
    text: "???" 
};

const EVENT_USER_REGISTER={
    value: 1,
    text: "You registered as a user" 
};

const EVENT_USER_LOGIN={
    value: 2,
    text: "You just logged in as %username" 
};

const EVENT_BALLOT_CREATED={
    value: 30,
    text: "Ballot %name (uid: %uid) was just created"
};

const EVENT_BALLOT_UPDATED={
    value: 31,
    text: "ballot %name (uid: %uid) was updated"
};

const EVENT_BALLOT_PREPUBLISHED={
    value: 32,
    text: "ballot %name (uid: %uid) was pre-published"
};

const EVENT_BALLOT_PUBLISHED={
    value: 33,
    text: "ballot %name (uid: %uid) was published"
};

const EVENT_BALLOT_DELETED={
    value: 34,
    text: "ballot %name (uid: %uid) was deleted"
};

const EVENT_QUESTION_CREATED={
    value: 40,
    text: "Question %title (uid: %uid) was just created"
};

const EVENT_QUESTION_UPDATED={
    value: 41,
    text: "Question %title (uid: %uid) was updated"
};

const EVENT_QUESTION_DELETED={
    value: 44,
    text: "Question %title (uid: %uid) was deleted"
};

const EVENT_ERROR={
    value: 100,
    text: "An error occured..."
};

const aEvents = [
    EVENT_UNKNOWN,
    
    EVENT_USER_REGISTER,
    EVENT_USER_LOGIN,
    
    EVENT_BALLOT_CREATED,
    EVENT_BALLOT_UPDATED,   
    EVENT_BALLOT_PREPUBLISHED,
    EVENT_BALLOT_PUBLISHED,
    EVENT_BALLOT_DELETED,

    EVENT_QUESTION_CREATED,
    EVENT_QUESTION_UPDATED,
    EVENT_QUESTION_DELETED,

    EVENT_ERROR
]

const getEventText = (_i) =>  {
    const iEvent = aEvents.findIndex(function (x) {return x.value===_i});
    if(iEvent==-1) {
        return EVENT_ERROR.text;
    }
    return aEvents[iEvent].text
}

module.exports = {
    aEvents,
    aEventsTypes: aEvents.map((x)=>{return x.value}),
    getEventText,

    EVENT_UNKNOWN,
    
    EVENT_USER_REGISTER,
    EVENT_USER_LOGIN,
    
    EVENT_BALLOT_CREATED,
    EVENT_BALLOT_UPDATED,
    EVENT_BALLOT_PREPUBLISHED,
    EVENT_BALLOT_PUBLISHED,
    EVENT_BALLOT_DELETED,

    EVENT_QUESTION_CREATED,
    EVENT_QUESTION_UPDATED,
    EVENT_QUESTION_DELETED,

    EVENT_ERROR

}