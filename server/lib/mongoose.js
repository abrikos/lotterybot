const mongoose = require("mongoose");
// подключение
mongoose.connect("mongodb://localhost:27017/lotterybot", {useNewUrlParser: true});
//mongoose.connect("mongodb://108.160.143.119:27017/minterEarth", {useNewUrlParser: true});

module.exports = {
    Types: mongoose.Types,
    connection: mongoose.connection,
    checkOwnPassport: function (model, passport) {
        if (!passport) return false;
        return JSON.stringify(passport.user._id) === JSON.stringify(model.user.id);
    },
    checkOwnCookie: function (model, cookie) {
        if (!cookie) return false;
        if (!cookie.length) return false;
        return cookie.indexOf(model.cookieId) !== -1;
    },
    User: require('../models/User-Model'),
    EmailConfirm: require('../models/EmailConfirm-Model'),
    Wallet: require('../models/Wallet-Model'),
    Transaction: require('../models/Transaction-Model'),
    Referral: require('../models/Referal-Model'),
};
