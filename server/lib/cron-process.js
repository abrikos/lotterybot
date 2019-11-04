import {Configurator} from 'server/lib/Configurator'
//const Centrifuge = require("centrifuge");
const logger = require('logat');
const CronJob = require('cron').CronJob;
const mongoose = require('./mongoose');


//mongoose.Transaction.find({hash:'Mtcbdd8665ef465de63a62d43b30c8f0051bdf1aa1935099415558fa169b05c01a'})    .then(console.log)
//mongoose.Wallet.findById('5dbfe523083a7b02d23426c0').populate(mongoose.Wallet.population).then(wallet=>{wallet.transactions = []; console.log(wallet)})


export default {
    bot: null,
    init(bot) {
        if (0) {
            mongoose.User.deleteMany({}, console.log);
            mongoose.Wallet.deleteMany({}, console.log);
            mongoose.Lottery.deleteMany({}, console.log);
            mongoose.Transaction.deleteMany({}, console.log);
            return;
        }

        this.bot = bot;
        const jobs = {};
        jobs.transactions = new CronJob('*/10 * * * * *', async () => {
            for (const network of Configurator.getKeys()) {
                const App = new Configurator(network);
                let lottery = await mongoose.Lottery.findOne({finishTime: 0, network})
                    .populate(mongoose.Lottery.population);
                mongoose.Wallet.find({user: {$ne: null}, network})
                    .populate(mongoose.Wallet.population)
                    .then(wallets => {
                        for (const wallet of wallets) {

                            App.crypto.loadTransactions(wallet.address)
                                .then(transactions => {
                                    for (const transaction of transactions.filter(tx=>tx.to !== App.getOwnerAddress())) {
                                        mongoose.Transaction.findOne({hash: transaction.hash})
                                            .then(txFound => {
                                                if (!txFound) {
                                                    if (transaction.to !== wallet.address) {

                                                        lottery.getInfo()
                                                            .then(lotteryInfo => {
                                                                const message = `Lottery payed: *${transaction.value}* ${transaction.coin}\n\n${lotteryInfo}`;
                                                                logger.info(message)
                                                                //this.bot.sendMessage(App.getGroupId(), message, {parse_mode: "Markdown"});
                                                            })
                                                    } else {
                                                        transaction.fromUser = true;
                                                        const found = wallet.user.addresses.find(a => a.network === network)
                                                        if (!found) {
                                                            wallet.user.addresses.push({address:transaction.from, network})
                                                            wallet.user.save()
                                                        }

                                                    }
                                                    transaction.wallet = wallet;
                                                    transaction.lottery = lottery;
                                                    mongoose.Transaction.create(transaction).catch(console.error);
                                                }
                                            })
                                    }
                                });
                            /*if(wallet.balance)
                            wallet.moveToLottery(lottery)
                                .catch(console.error);*/
                        }
                    })

            }
        }, null, true, 'America/Los_Angeles');

        jobs.moveToLottery = new CronJob('*/10 * * * * *', async () => {
            //mongoose.Wallet.setBalances();
            mongoose.Transaction.find({fromUser: true, fundsMoved: false})
                .populate([
                    {
                        path: 'lottery',
                        populate: [
                            {
                                path: 'wallet',

                            }
                        ]
                    },
                    {
                        path: 'wallet',
                        populate: [
                            {
                                path: 'user',
                                populate: 'parent'
                            }
                        ]
                    }
                ])
                .then(transactions => {
                    for (const transaction of transactions) {
                        transaction.moveToLottery()
                        //.catch(console.error)
                    }
                })
        }, null, true, 'America/Los_Angeles');

        jobs.lotteryFinish = new CronJob('*/10 * * * * *', async () => {
            //mongoose.Wallet.setBalances();
            for (const network of Configurator.getKeys()) {
                const App = new Configurator(network);
                const lottery = await mongoose.Lottery.getCurrent(network);
                const winnerTx = await lottery.finish();
                if (winnerTx) {
                    logger.info(winnerTx);
                    this.bot.sendMessage(App.getGroupId(), `${network} lottery finished. Prize: *${winnerTx.value}* ${App.getCoin()}\nTX: ${winnerTx.hash}`, {parse_mode: "Markdown"});
                }
            }
        }, null, true, 'America/Los_Angeles');

        jobs.day = new CronJob('0 0 0 * * *', async function () {
            console.log('Day  job');
        }, null, true, 'America/Los_Angeles');

        jobs.userAddWallets = new CronJob('0 0 * * * *', async function () {
            console.log('Hour  job');
            mongoose.User.find()
                .populate('wallets')
                .then(users => {
                    for (const user of users) {
                        for (const network of Configurator.getKeys()) {
                            if (!user.getWallet(network)) {
                                mongoose.Wallet.createNew(network, user);
                            }
                        }
                    }
                })
        }, null, true, 'America/Los_Angeles');

        for (const key of Object.keys(jobs)) {
            if (!jobs[key].running) {
                jobs[key].start();
            } else {
                logger.info(`JOB ${key} already running`)
            }
        }

        //this.minterCentrifuge('MNT');

    },
    /*async checkTransactions(network, tx) {
        if (tx.error) return;
        if (!tx.data.to) return;
        if (!tx.value) return;
        const wallet = await mongoose.Wallet.findOne({address: tx.data.to, user: {$ne: null}, network}).populate([{path: 'user', populate: 'parent'}]);
        if (!wallet) return;

        wallet.balance += tx.value;
        await wallet.save();
        tx.wallet = wallet;

        const lottery = await mongoose.Lottery.getCurrent(network);
        const winnerTx = await lottery.finish();
        if (winnerTx) {

            this.bot.sendMessage(Configurator.getGroupId(), `${network} lottery finished. Prize: *${winnerTx.value}* ${Configurator.getNetwork(network).coin}\nTX: ${winnerTx.hash}`, {parse_mode: "Markdown"});
        }
        tx.lottery = lottery;
        const message = `Tickets bought: *${tx.value}*\nTX:*${tx.hash}*)\n\n${await lottery.getInfo()}`;
        this.bot.sendMessage(Configurator.getGroupId(), message, {parse_mode: "Markdown"});
        await mongoose.Transaction.createNew(network, tx);
    },

    minterCentrifuge(network) {
        const centrifuge = new Centrifuge(Configurator.getNetwork(network).centrifuge, {websocket: WebSocketClient});
        centrifuge.connect();
        centrifuge.subscribe("transactions", tx => {
            //console.log(tx)
            this.checkTransactions(network, MinterWallet.adaptTx(tx.data))
        });


        centrifuge.on('connect', function (context) {
            logger.info('Centrifuge connected')
            // now client connected to Centrifugo and authorized
        });
    }*/
}




