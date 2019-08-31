const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CONFIG = require("../../client/lib/config");



const modelSchema = new Schema({
        amount: {type: Number, default: 0},
        tx: {type: String, required: true},
        type: {type: String, required: true},
        from: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User from required']},
        to: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User to required']},
    },
    {
        timestamps: { createdAt: 'date' },
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });


module.exports = mongoose.model("Referral", modelSchema);

