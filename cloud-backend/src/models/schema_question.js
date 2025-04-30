
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const _Schema = new Schema({

    uid: {type: Number, required: true},                            // uid of question
    did_designer: {type: String, required: true},                      // who created this question (DID)

// dates
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: false },
    deleted_at: { type: Date, required: false },

// details
    title: {type: String, required: true},                           // title of Question
    image: {type: String, required: false},                          // image url associated to Question
    link: {type: String, required: false},                           // url link to more info
    rich_text: {type: String, required: true},                       // text of question (html formatted)

//  answers
    type: {type: String, required: true},                            // (eq: bool, mcq, select)
    aChoice: {type: Array, required: true},                          // array of all possible choices {text:..., value:... }

});

_Schema.set('toJSON', { getters: true, virtuals: true });

module.exports = mongoose.model('question', _Schema);;