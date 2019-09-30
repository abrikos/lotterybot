const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-find-or-create');
const Wallet = require('./Wallet-Model');
const logger = require("logat");

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
    const populate = [{path: 'wallets', options: {sort: {'date': -1}}}];
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

modelSchema.virtual('wallet')
    .get(function () {
        return this.wallets[0];
    });

modelSchema.virtual('referrals', {
    ref: 'User',
    localField: '_id',
    foreignField: 'referral',
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

