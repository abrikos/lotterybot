import {Configurator} from 'server/lib/Configurator'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logger = require('logat');

const modelSchema = new Schema({
        address: {type: String, index: true, required: true},
        seed: {type: String, required: true},
        //balance: {type: Number, default: 0},
        amount: {type: Number, default: 0},
        closed: {type: Boolean, default: false},
        sending: {type: Boolean, default: false},
        network: {type: String, required: true},
        fundsMovedTx: String,
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    },
    {
        timestamps: {createdAt: 'date'},
        //toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        //toJSON: {virtuals: true}
    });

modelSchema.virtual('coin')
    .get(function () {
        const App = new Configurator(this.network);
        return App.getCoin()
    });

modelSchema.virtual('ticketsCount')
    .get(function () {
        let sum = 0;
        for (const t of this.transactionsIn) {
            sum += t.ticketsCount;
        }
        return sum;
    });

modelSchema.virtual('transactionsIn')
    .get(function () {
        return this.transactions.filter(t => !t.fromUser);
    });

modelSchema.virtual('balance')
    .get(function () {
        let sum = 0;
        for(const tx of this.transactionsIn){
            sum += tx.value;
        };
        return sum;
    });


modelSchema.statics.fieldsAllowed = ['address', 'date', 'balance', 'amount'];
modelSchema.statics.population = [
    {path:'user'},
    {
        path: 'transactions',
    }
]




modelSchema.methods.transactionsToMain = function () {
    return this.transactions.find(tx => tx.toMain)
};

modelSchema.methods.close = async function () {
    this.closed = true;
    await this.save();
};

/*
modelSchema.methods.moveToLottery = async function (lottery) {
    if (!this.user) return;
    if (!this.balance) return;
    this.sending = true;
    let referral = 0;
    const list = [];
    if (this.user.parent && this.user.parent.paymentAddress) {
        const to = this.user.parent.paymentAddress;
        referral = this.balance * Configurator.getNetwork(this.network).referralPercent;
        list.push({to, value: referral});
    }
    list.push({to: lottery.wallet.address, value: this.balance - referral});
    logger.info('Move to lottery (if 2 then 0 - to referral)', list);
    // eslint-disable-next-line default-case
    await this.save();
    const Crypto = Configurator.getCryptoProcessor(lottery.network)
    const paymentTx2 = await Crypto.multiSendTx(list, this.seed, Configurator.config.appName + '. Referral payment')
    if (paymentTx2.error) {
        logger.error("Can't move from user wallet to lottery wallet", list, paymentTx2);
    }else{
        this.balance = 0;
    }
    this.sending = false;
    this.save();
    return paymentTx2;

}
*/

/*

modelSchema.methods.setBalance = function () {
    const wallet = this;
    const Crypto = new Configurator.getCryptoProcessor(this.network);
    Crypto.getBalance(wallet.address)
        .then(balance => {
            if (isNaN(balance)) return;
            wallet.balance = balance;
            wallet.save();
        }).catch(logger.error);

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
*/

modelSchema.statics.createNew = async function (network, user) {
    const App = new Configurator(network);
    //const Crypto = Configurator.getCryptoProcessor(network);
    const wallet = new this(await App.crypto.generateWallet());
    wallet.network = network;
    wallet.user = user;
    await wallet.save();
    //logger.info('Wallet created', network)
    return wallet;
};

modelSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'wallet',
    justOne: false // set true for one-to-one relationship
});


module.exports = mongoose.model("Wallet", modelSchema);

