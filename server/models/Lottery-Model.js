import MinterWallet from "server/lib/networks/Minter";
import moment from "moment";

const t = require("server/i18n");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//const config = require("server/config");
const Configurator = require("server/lib/Configurator").default;
const Wallet = require('./Wallet-Model');
const logger = require('logat');
const shortUrl = require('shorturl');


const modelSchema = new Schema({
        network: {type: String, required: true},
        stopLimit: {type: Number, default: 1000},
        finishTime: {type: Number, default: 0},
        startTime: {type: Number, default: 0},
        paymentTx: String,
        wallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: [true, 'Wallet required']},
        winner: {type: mongoose.Schema.Types.ObjectId, ref: 'Transaction'},
    },
    {
        timestamps: {createdAt: 'createdAt'},
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });

modelSchema.methods.finish = async function () {
    if (this.finishTime) return;
    if (this.wallet.balance < Math.ceil(Configurator.getNetwork(this.network).stopSum / Configurator.config.lotteryPercent)) return;

    const players = [];
    for (const tx of this.transactions) {
        for (let i = 0; i < Math.ceil(tx.value); i++) {
            players.push(tx);
        }
    }
    this.winner = players[Math.floor(Math.random() * players.length)];
    const Crypto = Configurator.getCryptoProcessor(this.network);
    const list = [
        {to: this.winner.from, value: Configurator.getNetwork(this.network).stopSum},
        {to: Configurator.getNetwork(this.network).ownerAddress, value: this.wallet.balance - Configurator.config.lotteryStopSum},
    ];
    const commission = await Crypto.multiSendCommission(list, this.wallet.seed, Configurator.config.appName + '. Lottery winner');
    list[0].value += commission / 2;
    list[1].value -= commission;
    const paymentTx = await Crypto.multiSendTx(list, this.wallet.seed, Configurator.config.appName + '. Lottery winner');
    if (paymentTx.error) {
        return logger.error("Can't send to winner", this.wallet.address, list, paymentTx);
    }
    this.paymentTx = paymentTx.hash;
    this.finishTime = new Date().valueOf();
    await this.save();
    await this.wallet.close();
    return this.paymentTx;
};

modelSchema.statics.getBank = async function () {
    const lottery = await this.getCurrent();
    return lottery.balance;
};

modelSchema.methods.ticketsCount = async function () {
    let sum = 0;
    for (const t of this.transactions) {
        sum += t.value;
    }
    return sum;
}

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
    {path: 'transactions', populate: 'wallet'},
    'wallet'
];

modelSchema.statics.getCurrent = async function (network) {
    let lottery = await this.findOne({finishTime: 0, network})
        .populate(this.population);
    if (!lottery) {
        const wallet = await Wallet.createNew(network);
        lottery = new this({finishTime: 0, startTime: new Date().valueOf(), wallet, network});
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

modelSchema.virtual('date')
    .get(function () {
        return moment(this.createdAt).format('YYYY-MM-DD HH:mm')
    });

modelSchema.virtual('startDate')
    .get(function () {
        return moment(this.startTime).format('YYYY-MM-DD HH:mm')
    });


modelSchema.methods.getLotteryLink = function () {
    const Crypto = Configurator.getCryptoProcessor(this.network);
    return (Crypto.getAddressLink(this.wallet.address));
};

modelSchema.methods.getWinnerLink = function () {
    const Crypto = Configurator.getCryptoProcessor(this.network);
    return (Crypto.getTransactionLink(this.paymentTx));
};

modelSchema.methods.getInfo = async function () {
    const lotteryTickets = await this.ticketsCount();
    return t('Crypto currency') + `: *${Configurator.getNetwork(this.network).name}*`
        + '\n' + t('Referral program') + `: *${Configurator.getNetwork(this.network).referralPercent * 100}%*`
        + '\n' + t('Lottery starts') + `: *${this.startDate}*`
        + '\n' + t('The lottery will end when the balance of it wallet reaches') + `: *${Math.ceil(Configurator.getNetwork(this.network).stopSum / Configurator.config.lotteryPercent)}* ${this.coin}`
        + '\n' + t('Current lottery balance') + `: *${this.wallet.balance.toFixed(2)}* ${this.coin}`
        + '\n' + t('Lottery wallet') + `: ${this.getLotteryLink()}`
        + '\n' + t('Total tickets') + `:* ${lotteryTickets}*`
};

modelSchema.virtual('coin')
    .get(function () {
        return Configurator.getNetwork(this.network).coin
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

