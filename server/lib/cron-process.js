import MinterWallet from "server/lib/networks/Minter";
import Configurator from 'server/lib/Configurator'

const Centrifuge = require("centrifuge");
const WebSocketClient = require("websocket").w3cwebsocket;
const logger = require('logat');
const CronJob = require('cron').CronJob;
const mongoose = require('./mongoose');

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
        jobs.seconds5 = new CronJob('*/10 * * * * *', async () => {
            mongoose.Wallet.setBalances();
            for (const network of Configurator.getNetsKeys()) {
                const lottery = await mongoose.Lottery.getCurrent(network);
                lottery.finish();
                mongoose.Wallet.find({balance: {$gt: 0}, user: {$ne: null}, network})
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
                        for (const network of Configurator.getNetsKeys()) {
                            if (!user.getWallet(network)) {
                                mongoose.Wallet.createNew(network, user);
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
    async checkTransactions(network, tx) {
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

            this.bot.sendMessage(process.env.GROUP_ID, `${network} lottery finished. Prize: *${winnerTx.value}* ${Configurator.getNetwork(network).coin}\nTX: ${winnerTx.hash}`, {parse_mode: "Markdown"});
        }
        tx.lottery = lottery;
        const message = `Tickets bought: *${tx.value}*\nTX:*${tx.hash}*)\n\n${await lottery.getInfo()}`;
        this.bot.sendMessage(process.env.GROUP_ID, message, {parse_mode: "Markdown"});
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
    }
}




