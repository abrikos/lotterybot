import {Configurator} from 'server/lib/Configurator'
//const Centrifuge = require("centrifuge");
const logger = require('logat');
const CronJob = require('cron').CronJob;
const mongoose = require('./mongoose');


//mongoose.Transaction.findById('5dc51d7fde99157de21e63ef').then(console.log)
//mongoose.Wallet.find({user:{$ne:null}}).then(console.log)
//mongoose.Transaction.deleteMany({}, console.log);mongoose.Payment.deleteMany({}, console.log);mongoose.Payment.collection.dropAllIndexes(console.log)


//USER ADDRESS
/*
mongoose.Wallet.findOne({address:'0x24918203c53f21ca9c7ace7f6a11749737489675'.toLowerCase()})
    .then(w=>{
        const A = new Configurator(w.network);
        //ADDRESS LOTTERY
        A.crypto.send({address:'0x51db9a536e75d4b52a066bec82af9c584b9fe328', pk: w.seed, amount:0.001})
    })
*/


export default {

    bot: null,

    async run(bot) {

        this.bot = bot;
        const jobs = {};

        jobs.transactions = new CronJob('*/3 * * * * *', async () => {
            logger.info('cron transactions')
            const wallets = await mongoose.Wallet.find()
                .populate(mongoose.Wallet.population);
            for (const wallet of wallets) {
                const App = new Configurator(wallet.network);
                logger.info('Wallet', App.crypto.getAddressLink(wallet.address))
                const transactions = await App.crypto.loadTransactions(wallet.address);
                for (const transaction of transactions) {
                    logger.info('TX check', App.crypto.getTransactionLink(transaction.hash))
                    const txFound = await mongoose.Transaction.findOne({hash: transaction.hash});
                    if (txFound) {
                        continue;
                    }
                    if (transaction.message.type === 'winner') {
                        const message = `${App.getNetwork().name} lottery finished. Prize: *${transaction.value}* ${transaction.coin}\nTX: ${App.crypto.getTransactionLink(transaction.hash)}`;
                        //logger.info(message)
                        this.bot.sendMessage(Configurator.getGroupId(), message, {parse_mode: "Markdown"});
                    }
                    if (transaction.message.type === 'lottery') {
                        //logger.info(transaction, wallet)
                        const message = `Lottery payed: *${transaction.value}* ${transaction.coin}\n\n${App.lotteryInfo(wallet.lottery)}`;
                        //logger.info(message)
                        this.bot.sendMessage(Configurator.getGroupId(), message, {parse_mode: "Markdown"});
                    }
                    if (transaction.message.type === 'owner') {
                        const message = `EARNED: *${transaction.value}* ${transaction.coin} ${App.crypto.getTransactionLink(transaction.hash)}`;
                        this.bot.sendMessage(process.env.OWNER_ID, message, {parse_mode: "Markdown"});
                    }
                    if (transaction.message.type === 'referral') {
                        const message = `REFERRAL: *${transaction.value}* ${transaction.coin}`;
                        logger.info(message)
                    }
                    transaction.wallet = wallet;
                    transaction.lottery = wallet.currentLottery;
                    transaction.coin = App.getCoin();

                    await mongoose.Transaction.create(transaction);
                    logger.info('TX ADDED', App.crypto.getTransactionLink(transaction.hash))
                }

            }

        }, null, true, 'America/Los_Angeles');


        jobs.paymentsFromUserWallet = new CronJob('*/5 * * * * *', async () => {
            const transactions = await mongoose.Transaction.find({paymentProcessed: null})
                .populate(mongoose.Transaction.population);

            for (const transaction of transactions) {
                const App = new Configurator(transaction.network)
                if(!transaction.walletFrom){
                    logger.info('TRY set referral address');
                    await App.setReferralAddress(transaction.walletTo.user, transaction.from);
                }

                if (App.payReferralParent(transaction) && App.moveToLottery(transaction)) {
                    transaction.paymentProcessed = true;
                    transaction.save();
                }
                //.catch(console.error)
            }

        }, null, true, 'America/Los_Angeles');


        jobs.executePayments = new CronJob('*/10 * * * * *', async () => {
            const payment = await mongoose.Payment.findOne({payedTx: null})
                .populate(mongoose.Payment.population);
            if (!payment) return;
            const App = new Configurator(payment.lottery.network);
            const paymentTx = await App.paymentExecute(payment);
            if (paymentTx.error) return;
            logger.info('TRANSACTION PAYED',App.crypto.getTransactionLink(paymentTx.hash));

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




