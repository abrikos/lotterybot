import {Configurator} from 'server/lib/Configurator'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-find-or-create');
const Wallet = require('./Wallet-Model');
const Lottery = require('./Lottery-Model');
const logger = require("logat");


const referralAddressSchema = new Schema({
    address: {type: String, require: true},
    network: {type: String, require: true},
});


const modelSchema = new Schema({
        id: {type: Number, unique: true},
        first_name: String,
        username: String,
        paymentAddress: String,
        language_code: String,
        changeAddress: Boolean,
        addresses: [referralAddressSchema],
        waitForReferralAddress: String,
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

modelSchema.statics.population = [
    {
        path: 'wallets',
        options: {sort: {'date': -1}},
        populate: [
            {path: 'transactions',}
        ]
    },
    {path: 'referrals'}
];

modelSchema.statics.getUser = async function (from) {
    let user = await this.findOne({id: from.id})
    //.populate(populate);
    if (!user) {
        user = new this(from);
        await user.save();
        for (const network of Configurator.getKeys()) {
            await Wallet.createNew(network, user);
        }
    }
    user = await user.populate(this.population).execPopulate();
    return user;
};


modelSchema.methods.setReferralAddress = function (address) {
    const App = new Configurator(this.waitForReferralAddress);
    const network = App.getNetwork();
    if (!network) return {error: 'WRONG NETWORK:' + this.waitForReferralAddress};
    const regexp = new RegExp(network.walletAddressRegexp);
    if (!address.match(regexp)) return {error: 'Wrong address', network}
    const found = this.addresses.find(a => a.network === network.key)
    if (found) {
        found.address = address;
    } else {
        this.addresses.push({address, network: network.key})
    }
    this.waitForReferralAddress = null;
    this.save();
    return {network}
};

modelSchema.methods.ticketsCount = async function (lottery) {
    const user = this;

    const transactions = lottery.transactions.filter(t => {
        return t.wallet.user.toString() === user._id.toString()
    });

    let sum = 0;
    for (const t of transactions) {
        sum += t.value;
    }
    return Math.ceil(sum);
};

modelSchema.methods.getWallet = function (network) {
    return this.wallets.find(w => w.network === network)
};


modelSchema.virtual('referralLink')
    .get(function () {
        return `https://telegram.me/${Configurator.getBotName()}?start=${this._id}`;
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

