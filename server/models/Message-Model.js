const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CONFIG = require("../../client/lib/config");


const modelSchema = new Schema({
        text: String,
        sent: Number,
        //date: {type: Number, default: Date.now},
        from: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User required']},
        to: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User required']},
    },
    {
        timestamps: { createdAt: 'date' },
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });


module.exports = mongoose.model("Message", modelSchema);

