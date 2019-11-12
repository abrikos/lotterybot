import {CB} from "server/lib/CB";
import {Configurator} from "server/lib/Configurator";

const i18n = require("i18n");
const passportLib = require('../lib/passport');
const mongoose = require("../lib/mongoose");
const logger = require('logat');
const Minter = require('server/lib/networks/Minter');
const to = require('../lib/to');


module.exports.controller = function (app) {
    const Callback = new CB();

    async function getUser(req) {
        const user =await mongoose.User.findOne({id: req.session.passport.user.id})
            .populate([
                {path:'wallets', select:'address'},
                'referrals'
                ])
        i18n.setLocale(user.language_code);
        return user
    }

    app.post('/api/language', (req, res) => {
        if (!req.session.passport) return res.send({code: 'en'});
        getUser(req)
            .then(user => res.send({code: user.language_code}))
    });

    app.post('/api/cabinet/referral-link', passportLib.isLogged, (req, res) => {
        getUser(req)
            .then(user => {
                Callback.process('cabinet@reflink', user)
                    .then(response => {
                        if (response.error) return res.send({error: 500, message: response.error});
                        res.send(response)
                    })
            })
    });

    app.post('/api/cabinet/referral-addresses', passportLib.isLogged, (req, res) => {
        getUser(req)
            .then(user => {
                const addresses = [];
                for(const network of Configurator.getKeys()){
                    const App = new Configurator(network)
                    addresses.push({network, coin: App.network.coin, name: App.network.name, address:user.addresses.find(a=>a.network===network)})
                }
                res.send(addresses)

            })
    });

    app.post('/api/cabinet/referrals', passportLib.isLogged, async (req, res) => {
        getUser(req)
            .then(user => {

                Callback.process('cabinet@referrals', user)
                    .then(response => {
                        if (response.error) return res.send({error: 500, message: response.error});
                        res.send(response)
                    })
            })

    });

    app.post('/api/cabinet/user', passportLib.isLogged, (req, res) => {
        mongoose.User.findById(req.session.passport.user._id)
            .populate({path: 'referral', select: mongoose.User.fieldsAllowed.join(' ')})
            .select(mongoose.User.fieldsAllowed.join(' ') + ' username')
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