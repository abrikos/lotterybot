import moment from "moment";
const logger = require('logat');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const modelSchema = new Schema({
        hash: {type: String, required: true, unique: true},
        from: {type: String, required: true, index: true},
        to: {type: String, required: true, index: true},
        coin: {type: String, required: true},
        network: {type: String, required: true},
        message: {type: Object},
        paymentProcessed: {type: Boolean},
        //type: {type: String, enum: ['fromUser', 'toUser', 'toLottery', 'toOwner', 'toReferral'],},
        timestamp: {type: Number, required: true},
        value: {type: Number, default: 0},
        lottery: {type: mongoose.Schema.Types.ObjectId, ref: 'Lottery', required: [true, 'Lottery required']},
        //wallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet'},
        //txToReferralHash: {type: String},
        //txToLotteryHash: {type: String},
    },
    {
        //toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        //toJSON: {virtuals: true}
    });

modelSchema.statics.population = [
    {
        path: 'walletTo',
        populate: [
            {
                path: 'user',
                populate: 'parent'
            }
        ]
    },
    {
        path: 'lottery',
        populate: 'wallet'
    },
    'payments', 'walletFrom'
];


modelSchema.virtual('referralAddress')
    .get(function () {
        const obj = this.walletTo && this.walletTo.user && this.walletTo.user.parent && this.walletTo.user.parent.addresses && this.walletTo.user.parent.addresses.find(a => a.network === this.network)
        return obj && obj.address;
    });

modelSchema.virtual('date')
    .get(function () {
        return moment(this.timestamp).format('YYYY-MM-DD HH:mm')
    });


modelSchema.virtual('walletFrom', {
    ref: 'Wallet',
    localField: 'from',
    foreignField: 'address',
    //options:{match:{paymentTx:null}},
    justOne: true // set true for one-to-one relationship
});

modelSchema.virtual('walletTo', {
    ref: 'Wallet',
    localField: 'to',
    foreignField: 'address',
    //options:{match:{paymentTx:null}},
    justOne: true // set true for one-to-one relationship
});

modelSchema.virtual('payments', {
    ref: 'Payment',
    localField: 'hash',
    foreignField: 'starterTx',
    //options:{match:{paymentTx:null}},
    justOne: false // set true for one-to-one relationship
});


module.exports = mongoose.model("Transaction", modelSchema);

