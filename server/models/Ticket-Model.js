import moment from "moment";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const modelSchema = new Schema({
        value: {type: Number, default: 0},
        lottery: {type: mongoose.Schema.Types.ObjectId, ref: 'Lottery', required: [true, 'Lottery required']},
        wallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet'},
    },
    {
        timestamps: {createdAt: 'createdAt'},
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });

modelSchema.virtual('date')
    .get(function () {
        return moment(this.createdAt).format('YYYY-MM-DD HH:mm')
    });


module.exports = mongoose.model("Ticket", modelSchema);

