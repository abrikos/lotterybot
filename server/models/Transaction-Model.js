import moment from "moment";
const logger = require('logat');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {Configurator} = require("server/lib/Configurator");


const modelSchema = new Schema({

        hash: {type: String, required: true},
        from: {type: String, required: true},
        to: {type: String, required: true, index: true},
        network: {type: String, required: true},
        message: {type: Object},
        ended: {type: Boolean, default: false},
        fundsMoved: {type: Boolean, default: false},
        fromUser: {type: Boolean, default: false},
        timestamp: {type: Number, required: true},
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

modelSchema.methods.moveToLottery = async function () {
    const App = new Configurator(this.network);
    let referral = 0;
    const list = [];
    if (this.wallet.user.parent && this.wallet.user.parent.paymentAddress) {
        const to = this.wallet.user.parent.paymentAddress;
        referral = this.value * App.getNetwork().referralPercent;
        list.push({to, value: referral});
    }
    list.push({to: this.lottery.wallet.address, value: this.value - referral});
    logger.info('Move to lottery (if 2 then 0 - to referral)', list);
    const paymentTx2 = await App.crypto.multiSendTx(list, this.wallet.seed, App.config.appName + '. Referral payment')
    if (paymentTx2.error) {
        logger.error("Can't move from user wallet to lottery wallet", list, paymentTx2);
    }else{
        this.fundsMoved = true;
        this.save();
    }

    return paymentTx2;

}


modelSchema.virtual('date')
    .get(function () {
        return moment(this.timestamp).format('YYYY-MM-DD HH:mm')
    });

modelSchema.virtual('chainId')
    .get(function () {
        const App = new Configurator(this.network);
        return App.getNetwork().chainId;
    });

modelSchema.virtual('ticketsCount')
    .get(function () {
        const App = new Configurator(this.network);
        return this.value / App.getStopSum() * 100;
    });

modelSchema.virtual('coin')
    .get(function () {
        const App = new Configurator(this.network);
        return App.getCoin()
    });


module.exports = mongoose.model("Transaction", modelSchema);

