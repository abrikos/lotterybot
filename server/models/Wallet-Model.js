const {generateWallet} = require("minterjs-wallet");

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const modelSchema = new Schema({
        address: {type: String, index: true, required: true},
        seed: {type: String, required: true},
        balance: {type: Number, default: 0},
        amount: {type: Number, default: 0},
        closed: {type: Boolean, default: false},
        fundsMovedTx: String,
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    },
    {
        timestamps: { createdAt: 'date' },
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });
modelSchema.statics.fieldsAllowed = ['address', 'date', 'balance', 'amount'];


modelSchema.methods.transactionsToMain = function () {
    return this.transactions.find(tx=>tx.toMain)
};

modelSchema.methods.close = async function () {
    this.closed = true;
    await this.save();
};


modelSchema.statics.createNew = async function (user) {
    const wallet = new this();
    const wt = generateWallet();
    wallet.seed = wt._mnemonic;
    wallet.address = wt.getAddressString();
    wallet.date = new Date().valueOf();
    wallet.user = user;
    await wallet.save();
    return wallet;
};

modelSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'wallet',
    justOne: false // set true for one-to-one relationship
});


module.exports = mongoose.model("Wallet", modelSchema);

