const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logger = require('logat');

const modelSchema = new Schema({
        address: {type: String, index: true, required: true},
        seed: {type: String, required: true},
        coin: {type: String, required: true},
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


modelSchema.methods.getBalance = function (lotteryId) {
        let sum = 0;
        for (const tx of this.transactionsIn.filter(tx=>tx.lottery.toString() === lotteryId.toString())) {
            sum += tx.value;
        };
        /*for (const tx of this.transactionsOut) {
            sum -= tx.value;
        };*/
        return sum;
    };


modelSchema.statics.fieldsAllowed = ['address', 'date', 'balance', 'amount'];
modelSchema.statics.population = [
    {
        path: 'lottery',
        populate: [
            {
                path: 'wallet',
                populate: ['transactionsIn', 'transactionsOut']
            }]
    },
    'user',
    'transactionsIn', 'transactionsOut',
    'currentLottery'
];



modelSchema.virtual('transactionsIn', {
    ref: 'Transaction',
    localField: 'address',
    foreignField: 'to',
    justOne: false // set true for one-to-one relationship
});

modelSchema.virtual('transactionsOut', {
    ref: 'Transaction',
    localField: 'address',
    foreignField: 'from',
    justOne: false // set true for one-to-one relationship
});

modelSchema.virtual('lottery', {
    ref: 'Lottery',
    localField: '_id',
    foreignField: 'wallet',
    //options:{match:{paymentTx:null}},
    justOne: true // set true for one-to-one relationship
});

modelSchema.virtual('currentLottery', {
    ref: 'Lottery',
    localField: 'network',
    foreignField: 'network',
    options:{match:{finishTime:0}},
    justOne: true // set true for one-to-one relationship
});


module.exports = mongoose.model("Wallet", modelSchema);

