import moment from "moment";
const t = require("server/i18n");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//const config = require("server/config");

//const Wallet = require('./Wallet-Model');
const logger = require('logat');

const modelSchema = new Schema({
        network: {type: String, required: true},
        coin: {type: String, required: true},
        stopLimit: {type: Number, default: 1000},
        finishTime: {type: Number, default: 0},
        wallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: [true, 'Wallet required']},
        winner: {type: mongoose.Schema.Types.ObjectId, ref: 'Transaction'},
    },
    {
        timestamps: {createdAt: 'createdAt'},
        //toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        //toJSON: {virtuals: true}
    });


modelSchema.statics.getBank = async function () {
    const lottery = await this.getCurrent();
    return lottery.balance;
};


modelSchema.statics.getAll = async function () {
    try {
        return await this.find()
            .sort([['startTime', 1]])
            .populate([{path: 'transactions'}, {path: 'wallet'}])
    } catch (e) {
        logger.error(e)
    }
};

modelSchema.statics.population = [
    {
        path: 'wallet',
    },
    'transactions'
];

modelSchema.virtual('balance')
    .get(function () {
        let sum = 0;
        for (const tx of this.transactions.filter(t => t.to === this.wallet.address)) {
            sum += tx.value;
        }
        return sum;
    });


modelSchema.virtual('date')
    .get(function () {
        return moment(this.createdAt).format('YYYY-MM-DD HH:mm')
    });


modelSchema.virtual('transactionsFromUser')
    .get(function () {
        return this.transactions.filter(t => [t.from, t.to].indexOf(this.wallet.address) === -1)
    });

modelSchema.virtual('transactionsToLottery')
    .get(function () {
        return this.transactions.filter(t => t.to === this.wallet.address)
    });



modelSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'lottery',
    //options:{match:{paymentTx:null}},
    justOne: false // set true for one-to-one relationship
});



module.exports = mongoose.model("Lottery", modelSchema);

