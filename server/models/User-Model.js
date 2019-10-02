const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-find-or-create');
const Wallet = require('./Wallet-Model');
const Lottery = require('./Lottery-Model');
const logger = require("logat");
const config = require("../../client/lib/config");

const modelSchema = new Schema({
        id: {type: Number, unique: true},
        first_name: String,
        username: String,
        paymentAddress: String,
        language_code: String,
        changeAddress: Boolean,
        parent: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    },
    {
        timestamps: {createdAt: 'date'},
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });
modelSchema.plugin(findOrCreate);

modelSchema.statics.getUser = async function (from) {
    const populate = [{path: 'wallets', options: {sort: {'date': -1}}}, {path:'referrals'}];
    let user = await this.findOne({id: from.id})
    //.populate(populate);
    if (!user) {
        user = new this(from);
        await user.save();
        await Wallet.createNew(user);

    }
    user = await user.populate(populate).execPopulate();
    return user;
};


modelSchema.methods.ticketsCount = async function () {
    const user = this;
    const lottery = await Lottery.getCurrent();

    const transactions = lottery.transactions.filter(t => { return  t.wallet.user.toString() === user._id.toString()});

    let sum = 0;
    for(const t of transactions){
        sum += t.value;
    }
    return Math.ceil(sum);
};

modelSchema.virtual('wallet')
    .get(function () {
        return this.wallets[0];
    });

modelSchema.virtual('referralLink')
    .get(function () {
        return `https://telegram.me/${config.botName}?start=${this._id}`;
    });

modelSchema.virtual('referrals', {
    ref: 'User',
    localField: '_id',
    foreignField: 'parent',
    justOne: false // set true for one-to-one relationship
});

modelSchema.virtual('wallets', {
    ref: 'Wallet',
    localField: '_id',
    foreignField: 'user',
    justOne: false // set true for one-to-one relationship
});

modelSchema.virtual('referralOut', {
    ref: 'Referral',
    localField: '_id',
    foreignField: 'from',
    justOne: false // set true for one-to-one relationship
});


module.exports = mongoose.model("User", modelSchema);

