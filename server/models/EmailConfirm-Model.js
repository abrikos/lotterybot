const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const modelSchema = new Schema({
        code: String,
        //date: {type: Date, default: Date.now},
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User required']},
    },
    {
        timestamps: { createdAt: 'date' },
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });



module.exports = mongoose.model("EmailConfirm", modelSchema);

