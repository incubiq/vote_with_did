
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const _Schema = new Schema({

    chain: {type: String, required: true},                            // eg: cardano, ethereum, etc.
    id: {type: String, required: true},                               // eg: lace, yoroi, ...
    networkId: {type: Number, required: true},                        // eg: 1
    name: {type: String, required: true},                             // eg: Lace, Yoroi, ...
    logo: {type: String, required: true},                             // eg: data:image/...

// dates
    created_at: { type: Date, required: true },
    deleted_at: { type: Date, required: false },

});

_Schema.set('toJSON', { getters: true, virtuals: true });

module.exports = mongoose.model('wallet_type', _Schema);;