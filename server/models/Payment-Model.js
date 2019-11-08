import moment from "moment";
const logger = require('logat');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const modelSchema = new Schema({
        amount: {type: Number, required: true},
        lottery: {type: mongoose.Schema.Types.ObjectId, ref: 'Lottery', required: [true, 'Lottery required']},
        from: {type: String, required: true},
        to: {type: String, required: true},
        coin: {type: String, required: true},
        message: {type: Object},
        starterTx: {type: String, required: true},
        payedTx: {type: String},
        noCommission: {type: Boolean},
        type: {type: String, enum: ['lottery', 'referral', 'winner', 'owner']}
    },
    {
        timestamps: {createdAt: 'createdAt'},
        //toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        //toJSON: {virtuals: true}
    });


modelSchema.statics.population = [
    {
        path: 'lottery',
        populate: [
            {
                path: 'wallet',
            },
            'transactions'
        ]
    },
    {path: 'walletFrom'},
    {path: 'walletTo'},
    {path: 'transactionPay'},
    {path: 'transactionStart'},
];


modelSchema.virtual('date')
    .get(function () {
        return moment(this.createdAt).format('YYYY-MM-DD HH:mm')
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

modelSchema.virtual('transactionPay', {
    ref: 'Transaction',
    localField: 'payedTx',
    foreignField: 'hash',
    //options:{match:{paymentTx:null}},
    justOne: true // set true for one-to-one relationship
});

modelSchema.virtual('transactionStart', {
    ref: 'Transaction',
    localField: 'starterTx',
    foreignField: 'hash',
    //options:{match:{paymentTx:null}},
    justOne: true // set true for one-to-one relationship
});


module.exports = mongoose.model("Payment", modelSchema);

