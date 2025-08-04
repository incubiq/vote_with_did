
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const _Schema = new Schema({

// IDs
    uid: {type: Number, required: true},                            // ballot uid
    did_admin: {type: String, required: true},                      // who created this ballot (DID)
    a_did_designer: {type: Array, required: true, default: []},     // all users allowed to design the ballot  (array of DID)
    published_id: {type: String, required: false},                  // the ballot published DID on chain

// dates
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: false },
    published_at: { type: Date, required: false },                  // after this, opening times cannot be changed

    openingRegistration_at: { type: Date, required: false },        // opening of the registration period
    closingRegistration_at: { type: Date, required: false },
    openingVote_at: { type: Date, required: false },
    closingVote_at: { type: Date, required: false },

// all updates
    a_update_log: { type: Array, required: true, default: [] },

// creds for registering to vote
    aCreds: { type: Array, required: true, default: [] },           // array of all required creds to show for being accepted to vote

// ballot
    name: {type: String, required: true},                     // name of ballot
    aQuestion: {type: Array, required: true, default: []},                         // all questions in this ballot

});

_Schema.set('toJSON', { getters: true, virtuals: true });

module.exports = mongoose.model('ballot', _Schema);;