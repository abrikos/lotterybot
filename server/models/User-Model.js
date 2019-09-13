const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-find-or-create');


const modelSchema = new Schema({
        id: Number,
        first_name: String,
        username: String,
        wallet: String,
        language_code: String,
        changeAddress: Boolean
    },
    {
        timestamps: { createdAt: 'date' },
        toObject: {virtuals: true},
        // use if your results might be retrieved as JSON
        // see http://stackoverflow.com/q/13133911/488666
        toJSON: {virtuals: true}
    });
modelSchema.plugin(findOrCreate);



modelSchema.virtual('referrals', {
    ref: 'User',
    localField: '_id',
    foreignField: 'referral',
    justOne: false // set true for one-to-one relationship
});

modelSchema.virtual('referralOut', {
    ref: 'Referral',
    localField: '_id',
    foreignField: 'from',
    justOne: false // set true for one-to-one relationship
});



module.exports = mongoose.model("User", modelSchema);

