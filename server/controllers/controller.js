import {Configurator} from "server/lib/Configurator"
import {CB} from "server/lib/CB";
const i18n = require("i18n");

const passportLib = require('server/lib/passport');
const passport = require('passport');
const mongoose = require("server/lib/mongoose");
const logger = require('logat');
const moment = require('moment');
const to = require('server/lib/to')

module.exports.controller = function (app) {
    const Callback = new CB();
    const lotteryPopulate = [
        {path: 'wallet', select: 'address'},
        {path: 'transactions'}
    ]

    app.post('/api/lotteries', (req, res) => {
        mongoose.Lottery.find({finishTime: 0}).populate(lotteryPopulate)
            .then(lotteries => {
                const items = [];

                for (const l of lotteries.filter(l => Configurator.getNetworks().map(n => n.key).indexOf(l.network) > -1)) {
                    const App = new Configurator(l.network);
                    items.push({id: l.id, balance: l.balance.toFixed(App.network.toFixed), coin: App.network.coin, network: App.network.name, stopLimit: l.stopLimit.toFixed(App.network.toFixed), date: l.date});
                }
                res.send(items)
            })

    });

    app.post('/api/lottery/:id', async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.send({error: 500, message: 'Wrong ID'});
        if(req.session){
            const user = await mongoose.User.findOne({id:req.session.passport.user.id});
            i18n.setLocale(user.language_code);
        }
        mongoose.Lottery.findById(req.params.id).populate(lotteryPopulate)
            .then(lottery => {
                if (!lottery) res.send({error: 404, message: 'NO lotteries found'});
                const App = new Configurator(lottery.network);
                Callback.process('lottery@info#' + lottery.id)
                    .then(info =>
                        res.send({
                            name: App.network.name,
                            coin: lottery.coin,
                            address: lottery.wallet.address,
                            date: lottery.date,
                            stopLimit: lottery.stopLimit,
                            transactions: lottery.transactionsFromUser,
                            info:info.message
                        })
                    )
            })

    });

    app.post('/api/status', (req, res) => {
        res.send({ok: 200})
    });

    app.post('/api/bot-name', (req, res) => {
        res.send({botName: Configurator.getBotName()})
    });

    app.post('/api/loginFail', (req, res) => {
        res.send({error: "Login fail"})
    });

    app.post('/api/logout', (req, res) => {
        req.session.destroy(function (err) {
            logger.info(err)
            res.send({ok: 200})
        });
    });

    app.post('/api/login/telegram', passport.authenticate('telegram'), (req, res) => {
        res.send({ok: 200})
    });


    app.post('/api/isAuth', passportLib.isLogged, async (req, res) => {
        //const [error, user] = await to( mongoose.User.findById(req.session.passport.user.id));
        //if (!MinterWallet.checkAddress(user.address)) return res.send({error: 412, message:"No wallet's address", authenticated: true})
        res.send({authenticated: true})
    });


};