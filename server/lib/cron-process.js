import MinterWallet from "../lib/MinterWallet";

const Centrifuge = require("centrifuge");
const WebSocketClient = require("websocket").w3cwebsocket;
const logger = require('logat');
const CronJob = require('cron').CronJob;
const config = require('server/config');
const mongoose = require('./mongoose');

export default {
    bot: null,
    init(bot) {
        this.bot = bot;
        const jobs = {};
        jobs.seconds5 = new CronJob('*/10 * * * * *', async () => {
            for (const coin in config.coins) {
                mongoose.Wallet.setBalances(coin);
                const lottery = await mongoose.Lottery.getCurrent(coin);
                lottery.finish();
                mongoose.Wallet.find({balance: {$gt: 0}, user: {$ne: null}, coin})
                    .populate([{path: 'user', populate: 'parent'}])
                    .then(wallets => {
                        for (const w of wallets) w.moveToLottery(lottery)
                    })
            }
        }, null, true, 'America/Los_Angeles');

        jobs.seconds15 = new CronJob('*/15 * * * * *', async function () {
            mongoose.User.find()
                .populate('wallets')
                .then(users => {
                    for (const user of users) {
                        for (const coin in config.coins) {
                            if (!user.wallets.filter(w => w.coin === coin).length) {
                                mongoose.Wallet.createNew(coin, user);
                            }
                        }
                    }
                })
        }, null, true, 'America/Los_Angeles');

        jobs.day = new CronJob('0 0 0 * * *', async function () {
            console.log('Day  job');
        }, null, true, 'America/Los_Angeles');

        jobs.day = new CronJob('0 0 * * * *', async function () {
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
    async checkTransactions(coin, tx) {
        if (tx.error) return;
        if (!tx.data.to) return;
        if (!tx.value) return;
        const wallet = await mongoose.Wallet.findOne({address: tx.data.to, user: {$ne: null}, coin}).populate([{path: 'user', populate: 'parent'}]);
        if (!wallet) return;

        wallet.balance += tx.value;
        await wallet.save();
        tx.wallet = wallet;

        const lottery = await mongoose.Lottery.getCurrent(coin);
        const winnerTx = await lottery.finish();
        if (winnerTx) {

            this.bot.sendMessage(process.env.GROUP_ID, `${coin} lottery finished. Prize: *${winnerTx.value}* ${coin}\nTX: ${winnerTx.hash}`, {parse_mode: "Markdown"});
        }
        tx.lottery = lottery;
        const message = `Tickets bought: *${tx.value}*\nTX:*${tx.hash}*)\n\n${await lottery.getInfo()}`;
        this.bot.sendMessage(process.env.GROUP_ID, message, {parse_mode: "Markdown"});
        await mongoose.Transaction.createNew(coin, tx);
    },

    minterCentrifuge(coin) {
        const centrifuge = new Centrifuge(config.coins[coin].centrifuge, {websocket: WebSocketClient});
        centrifuge.connect();
        centrifuge.subscribe("transactions", tx => {
            //console.log(tx)
            this.checkTransactions(coin, MinterWallet.adaptTx(coin, tx.data))
        });


        centrifuge.on('connect', function (context) {
            logger.info('Centrifuge connected')
            // now client connected to Centrifugo and authorized
        });
    }
}




