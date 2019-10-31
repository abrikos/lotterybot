import MinterWallet from "server/lib/MinterWallet";

const {generateWallet} = require("minterjs-wallet");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Configurator = require("server/lib/Configurator").default;
const logger = require('logat');

const modelSchema = new Schema({
        address: {type: String, index: true, required: true},
        seed: {type: String, required: true},
        balance: {type: Number, default: 0},
        amount: {type: Number, default: 0},
        closed: {type: Boolean, default: false},
        coin: {type: String, required: true},
        fundsMovedTx: String,
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    },
    {
        timestamps: {createdAt: 'date'},
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });
modelSchema.statics.fieldsAllowed = ['address', 'date', 'balance', 'amount'];


modelSchema.methods.transactionsToMain = function () {
    return this.transactions.find(tx => tx.toMain)
};

modelSchema.methods.close = async function () {
    this.closed = true;
    await this.save();
};

modelSchema.methods.moveToLottery = function (lottery) {
    if (!this.user) return;
    if (!this.balance) return;
    let referral = 0;
    if (this.balance < 0.02) {
        this.balance = 0;
        this.save();
        return;
    }
    const list = [];
    console.log(this.user)
    if (this.user.parent && this.user.parent.paymentAddress) {
        const to = this.user.parent.paymentAddress;
        referral = this.balance * Configurator.config.referralPercent;
        list.push({to, value: referral});
    }
    list.push({to: lottery.wallet.address, value: this.balance - referral});
    logger.info('Move to lottery (if 2 then 0 - to referral)', list);
    // eslint-disable-next-line default-case
    const Crypto = Configurator.getCryptoProcessor(lottery.coin)
    Crypto.multiSendTx(lottery.coin, list, this.seed, Configurator.config.appName + '. Referral payment')
        .then(paymentTx2 => {
            if (paymentTx2.error) {
                logger.error("Can't move from user wallet to lottery wallet", list, paymentTx2);
                return;
            }
            this.balance = 0;
            this.save();
        });


}
;

modelSchema.methods.setBalance = function () {
    const wallet = this;
    const Crypto = Configurator.getCryptoProcessor(this.coin)
    Crypto.getBalance(wallet.address)
        .then(balance => {
            if (isNaN(balance)) return;
            wallet.balance = balance;
            wallet.save();
        });

};


modelSchema.statics.setBalances = function () {
    this.find({closed: false})
        .then(
            wallets => {
                for (const w of wallets) {
                    w.setBalance();
                }
            }
        );

};

modelSchema.statics.createNew = async function (coin, user) {
    const wallet = new this();
    const wt = generateWallet();
    wallet.coin = coin;
    wallet.seed = wt._mnemonic;
    wallet.address = wt.getAddressString();
    wallet.date = new Date().valueOf();
    wallet.user = user;
    await wallet.save();
    logger.info('Wallet created', coin)
    return wallet;
};

modelSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'wallet',
    justOne: false // set true for one-to-one relationship
});


module.exports = mongoose.model("Wallet", modelSchema);

