import MinterWallet from "../lib/MinterWallet";

const logger = require('logat');
const CronJob = require('cron').CronJob;
const config = require('client/lib/config');
const hostConfig = require("client/lib/host.config.local");
const NET = config[hostConfig.net];
const mongoose = require('./mongoose');

mongoose.Lottery.getCurrent().then(l=>{
    l.finish()
})


export default {
    init(bot){
        const jobs = {};
        jobs.seconds5 = new CronJob('*/10 * * * * *', async function () {
            mongoose.Wallet.setBalances();
            const lottery = await mongoose.Lottery.getCurrent();
            lottery.finish();
            mongoose.Wallet.find({balance: {$gt: 0}, user: {$ne: null}})
                .populate([{path: 'user', populate: 'parent'}])
                .then(wallets => {
                    for (const w of wallets) w.moveToLottery(lottery)
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


        const Centrifuge = require("centrifuge");
        const WebSocketClient = require("websocket").w3cwebsocket;
        const centrifuge = new Centrifuge(NET.centrifuge, {websocket: WebSocketClient});

        centrifuge.connect();

        centrifuge.subscribe("transactions", async function (transaction) {
            const tx = MinterWallet.adaptTx(transaction.data);
            if (tx.error) return;
            if (!tx.data.to) return;
            if (!tx.value) return;
            const wallet = await mongoose.Wallet.findOne({address: tx.data.to, user: {$ne: null}}).populate([{path: 'user', populate: 'parent'}]);
            if (!wallet) return;

            wallet.balance += tx.value;
            await wallet.save();
            tx.wallet = wallet;

            const lottery = await mongoose.Lottery.getCurrent();
            const winnerTx = await lottery.finish();
            if(winnerTx){

                bot.sendMessage(process.env.GROUP_ID, `Lottery finished. Prize: *${winnerTx.value}*\nTX: ${winnerTx.hash}`, {parse_mode: "Markdown"});
            }
            tx.lottery = lottery;
            const message = `Tickets bought: *${tx.value}*\nTX:*${tx.hash}*)\n\n${await lottery.getInfo()}`;
            bot.sendMessage(process.env.GROUP_ID, message, {parse_mode: "Markdown"});
            await mongoose.Transaction.createNew(tx);
        });


        centrifuge.on('connect', function (context) {
            logger.info('Centrifuge connected')
            // now client connected to Centrifugo and authorized
        });

    }
}




