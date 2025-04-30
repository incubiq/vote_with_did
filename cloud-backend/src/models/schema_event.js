
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const _Schema = new Schema({
    
    username: { type: String, required: true},        // who is this event for?
    type: {type: String, required: true},             // the type of event (eg "oauth")
    value: {type: String, required: false},            // extra data about what happened
    created_at: { type: Date, required: true},
});

_Schema.set('toJSON', { getters: true, virtuals: true });

module.exports = mongoose.model('event', _Schema);;