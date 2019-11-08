import {Configurator} from 'server/lib/Configurator'
//const Centrifuge = require("centrifuge");
const logger = require('logat');
const CronJob = require('cron').CronJob;
const mongoose = require('./mongoose');


//mongoose.Transaction.findOne({hash:'Mtaf750fc0ce2143fcb344dda36ff51452e7a8c5dcfd74d38036606b305dde49b4'}).then(console.log)
//mongoose.Transaction.deleteMany({}, console.log);mongoose.Payment.deleteMany({}, console.log);mongoose.Payment.collection.dropAllIndexes(console.log)

export default {
    bot: null,
    init(bot) {
        if (0) {
            //mongoose.User.deleteMany({}, console.log);
            mongoose.Wallet.deleteMany({}, () => {
                mongoose.User.find()
                    .populate('wallets')
                    .then(users => {
                        for (const user of users) {
                            for (const network of Configurator.getKeys()) {
                                if (!user.getWallet(network)) {
                                    const App = new Configurator(network);
                                    App.createWallet(user)
                                }
                            }
                        }
                    })
            });
            mongoose.Lottery.deleteMany({}, console.log);
            mongoose.Transaction.deleteMany({}, console.log);
            mongoose.Payment.deleteMany({}, console.log);
            return;
        }

        this.bot = bot;
        const jobs = {};

        for (const network of Configurator.getKeys()) {
            const App = new Configurator(network);
            mongoose.Lottery.findOne({finishTime: 0, network})
                .then(lottery => {
                    if (!lottery) App.lotteryCreate();
                });
        }

        jobs.transactions = new CronJob('*/10 * * * * *', async () => {
            const wallets = await mongoose.Wallet.find()
                .populate(mongoose.Wallet.population);
            for (const wallet of wallets) {
                const App = new Configurator(wallet.network);
                const transactions = await App.crypto.loadTransactions(wallet.address);
                for (const transaction of transactions) {
                    const txFound = await mongoose.Transaction.findOne({hash: transaction.hash});
                    if (txFound) {
                        const payment = await mongoose.Payment.findOne({starterTx: txFound.message.starterTx, payedTx:null}).populate(mongoose.Payment.population);
                        if (payment) {
                            logger.info('Found success pay transaction', transaction.hash)
                            //Close payment

                            if (payment.type === 'winner') {
                                const message = `${App.getNetwork().name} lottery finished. Prize: *${payment.amount}* ${payment.coin}\nTX: ${transaction.hash}`;
                                logger.info(message)
                                //this.bot.sendMessage(Configurator.getGroupId(), message, {parse_mode: "Markdown"});
                            }
                            if (payment.type === 'lottery') {
                                const message = `Lottery payed: *${payment.amount}* ${payment.coin}\n\n${App.lotteryInfo(payment.lottery)}`;
                                logger.info(message)
                                //this.bot.sendMessage(Configurator.getGroupId(), message, {parse_mode: "Markdown"});
                            }
                            if (payment.type === 'owner') {
                                const message = `EARNED: *${payment.amount}* ${payment.coin}`;
                                logger.info(message)
                            }
                            if (payment.type === 'referral') {
                                const message = `REFERRAL: *${payment.amount}* ${payment.coin}`;
                                logger.info(message)
                            }
                        }
                        continue;
                    }
                    transaction.wallet = wallet;
                    transaction.lottery = wallet.currentLottery;
                    transaction.coin = App.getCoin();
                    await mongoose.Transaction.create(transaction);
                }

            }

        }, null, true, 'America/Los_Angeles');


        jobs.paymentsFromUserWallet = new CronJob('*/10 * * * * *', async () => {
            const transactions = await mongoose.Transaction.find({paymentProcessed: null})
                .populate(mongoose.Transaction.population);

            for (const transaction of transactions) {
                const App = new Configurator(transaction.network)
                if (App.payReferralParent(transaction) && App.moveToLottery(transaction)) {
                    transaction.paymentProcessed = true;
                    transaction.save();
                }
                //.catch(console.error)
            }

        }, null, true, 'America/Los_Angeles');


        jobs.executePayments = new CronJob('*/10 * * * * *', async () => {
            const payments = await mongoose.Payment.find({payedTx: null})
                .populate(mongoose.Payment.population);
            for (const payment of payments) {
                const App = new Configurator(payment.lottery.network);
                const paymentTx = await App.paymentExecute(payment);
                if(!paymentTx.error) logger.info(paymentTx);
            }

        }, null, true, 'America/Los_Angeles');


        jobs.lotteryFinish = new CronJob('*/10 * * * * *', async () => {
            const lotteries = await mongoose.Lottery.find({finishTime: 0})
                .populate(mongoose.Lottery.population);
            for (const lottery of lotteries) {
                const App = new Configurator(lottery.network);
                await App.lotteryFinish(lottery);
            }
        }, null, true, 'America/Los_Angeles');

        jobs.day = new CronJob('0 0 0 * * *', async function () {
            console.log('Day  job');
        }, null, true, 'America/Los_Angeles');

        jobs.userAddWallets = new CronJob('0 0 * * * *', async function () {
            console.log('Hour  job');
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




