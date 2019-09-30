const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require("../../client/lib/config");
const Wallet = require('./Wallet-Model');

const modelSchema = new Schema({
        stopLimit: {type: Number, default: 1000},
        balance: {type: Number, default: 0},
        finishTime: {type: Number, default: 0},
        startTime: {type: Number, default: 0},
        paymentTx: String,
        wallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: [true, 'Wallet required']},
        winner: {type: mongoose.Schema.Types.ObjectId, ref: 'Transaction'},
    },
    {
        timestamps: {createdAt: 'date'},
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });

modelSchema.statics.getBank = async function () {
    const lottery = await this.getCurrent();
    return lottery.balance;
};

modelSchema.statics.getCurrent = async function () {
    let lottery = await this.findOne({finishTime: 0})
        .populate([
            {path: 'transactions', populate: 'wallet'},
            'wallet'
        ]);
    if (!lottery) {
        const wallet = await Wallet.createNew();
        lottery = new this({finishTime: 0, startTime: new Date().valueOf(), wallet});
        await lottery.save();
    }
    return lottery;
};


modelSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'lottery',
    justOne: false // set true for one-to-one relationship
});

modelSchema.virtual('wallets')
    .get(function () {
        return this.transactions.map(tx => tx.wallet)
    });

modelSchema.virtual('sum')
    .get(function () {
        let sum = 0;
        for (const tx of this.transactions) {
            sum += tx.value;
        }
        return sum;
    });


modelSchema.virtual('readyToFinish')
    .get(function () {
        return this.sum >= this.stopLimit;
    });

module.exports = mongoose.model("Lottery", modelSchema);

