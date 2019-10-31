import moment from "moment";
import MinterWallet from "../lib/MinterWallet";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configurator = require("server/lib/Configurator").default;


const modelSchema = new Schema({
        hash: {type: String, required: true},
        from: {type: String, required: true},
        to: {type: String, required: true, index: true},
        coin: {type: String, required: true},
        message: {type: Object},
        ended: {type: Boolean, default: false},
        chainId: {type: Number, required: true},
        date: {type: Number, required: true},
        value: {type: Number, default: 0},
        lottery: {type: mongoose.Schema.Types.ObjectId, ref: 'Lottery', required: [true, 'Lottery required']},
        wallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet'},
    },
    {
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });

modelSchema.statics.bank = async function () {
    const txs = await this.find({ended: false});
    let sum = 0;
    for (const tx of txs) {
        sum += tx.value;
    }
    return sum * Configurator.config.lotteryPercent;
};

modelSchema.statics.createNew = function (coin,tx) {
    try {
        return this.create({
            chainId: Configurator.config.coins[coin].chainId,
            ...tx
        })
    } catch (e) {
        console.log('Model-Transaction ERROR', e.message)
    }

};

/*
modelSchema.virtual('value')
    .get(function () {
        let amount = 0;
        if (this.data.list) {
            for (const l of this.data.list) {
                amount += l.value * 1
            }
        } else {
            amount = this.data.value * 1;
        }
        return amount;
    });
*/


module.exports = mongoose.model("Transaction", modelSchema);

