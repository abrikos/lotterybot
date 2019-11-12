import {CB} from "server/lib/CB";
const i18n = require("i18n");
const passportLib = require('../lib/passport');
const mongoose = require("../lib/mongoose");
const logger = require('logat');
const Minter = require('server/lib/networks/Minter');
const to = require('../lib/to');


module.exports.controller = function (app) {
    const Callback = new CB();


    app.post('/api/cabinet/language', async (req, res) => {
        return res.send({code: req.session.passport ? req.session.passport.user.language_code : 'en'})
    });

    app.post('/api/cabinet/referral-link', passportLib.isLogged, async (req, res) => {
        i18n.setLocale(req.session.passport.user.language_code);
        const response = await Callback.process('cabinet@reflink', req.session.passport.user);
        if(response.error) return res.send({error:500, message:response.error});
        res.send(response)
    });

    app.post('/api/cabinet/referrals', passportLib.isLogged, async (req, res) => {
        const [error, referrals] = await to(mongoose.Referral.find({to: req.session.passport.user}).populate('from', mongoose.User.fieldsAllowed).sort({date: -1}))
        if (error) return res.send(error);
        /*for (const referral of referrals) {

            const [err2, tx] = await to(mongoose.Transaction.findOne({hash: referral.tx}));

            referral.amount = tx.amountToMain;
        }*/

        res.send(referrals)
    });

    app.post('/api/cabinet/user', passportLib.isLogged, (req, res) => {
        mongoose.User.findById(req.session.passport.user._id)
            .populate({path:'referral', select: mongoose.User.fieldsAllowed.join(' ')})
            .select(mongoose.User.fieldsAllowed.join(' ')+' username')
            .then(user => {
                if (!user) return res.sendStatus(400)
                logger.info(user)
                res.send(user)
            })
            .catch(error => res.send({error: 500, message: error.message}))
    });

    app.post('/api/user/save', passportLib.isLogged, (req, res) => {
        mongoose.User.findById(req.session.passport.user._id)
            .select(mongoose.User.fieldsAllowed)
            .then(user => {
                if (!user) return res.sendStatus(400);
                for (const field of mongoose.User.fieldsAllowed) {
                    user[field] = req.body[field];
                }
                //if (!Minter.checkAddress(user.address)) return res.send({error:203, message:'Address invalid'});
                user.save()
                    .then(r => res.send({ok: 200}))
                    .catch(error => res.send({error: 500, message: error.message}))

            })
            .catch(error => res.send({error: 500, message: error.message}))
    });


};