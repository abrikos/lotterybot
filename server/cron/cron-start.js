import MinterWallet from "../lib/MinterWallet";

const logger = require('logat');
const CronJob = require('cron').CronJob;
const config = require('../../client/lib/config');
const hostConfig = require("../../client/lib/host.config.local");
const NET = config[hostConfig.net];
const mongoose = require('../lib/mongoose');
const to = require('../lib/to');

const jobs = {};

jobs.seconds5 = new CronJob('*/5 * * * * *', async function () {
    //const txs = await mongoose.Transaction.find({ended:false});
    const txs = await mongoose.Transaction.find({ended: false});
    const tickets = [];
    for (const tx of txs) {
        for (let i = 0; i < tx.value + 1; i++) {
            tickets.push(tx.from)

        }
    }


}, null, true, 'America/Los_Angeles');

jobs.day = new CronJob('0 0 0 * * *', async function () {
    console.log('Day  job');
}, null, true, 'America/Los_Angeles');

jobs.day = new CronJob('0 0 * * * *', async function () {
    console.log('Hour  job');
    const lottery = await mongoose.Lottery.getCurrent();
    for (const tx of lottery.transactions) {
        if (tx.wallet.balance > 0) await moveToLotteryWallet(lottery, tx)
    }
    await finishLottery(lottery);
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
    if (!tx.data.value) return;
    const wallet = await mongoose.Wallet.findOne({address: tx.data.to, user:{$ne: null}}).populate([{path: 'user', populate: 'parent'}]);
    if (!wallet) return;

    wallet.balance += tx.data.value * 1;
    await wallet.save();
    tx.wallet = wallet;

    const lottery = await mongoose.Lottery.getCurrent();
    await moveToLotteryWallet(lottery, tx);
    await finishLottery(lottery);
    tx.lottery = lottery;
    await mongoose.Transaction.createNew(tx);
});


async function finishLottery(lottery) {

    lottery.balance = await MinterWallet.getBalance(lottery.wallet.address);
    await lottery.save();
    if (lottery.balance < config.lotteryStopSum / config.lotteryPercent) return lottery;
    const players = [];
    for (const tx of lottery.transactions) {
        for (let i = 0; i < Math.ceil(tx.data.value); i++) {
            players.push(tx);
        }
    }
    const winner = players[Math.floor(Math.random() * players.length)];
    const paymentTx = await MinterWallet.send(winner.from, lottery.wallet.seed, config.lotteryStopSum);
    if (paymentTx.error) {
        logger.error(paymentTx);
        return lottery;
    }
    const ownerTx = await MinterWallet.sendAll(process.env.ADDRESS, lottery.wallet.seed);
    if (ownerTx.error) {
        logger.error(ownerTx, lottery.wallet.seed);
        return lottery;
    }
    lottery.finishTime = new Date().valueOf();
    lottery.winner = winner;
    lottery.paymentTx = paymentTx.hash;
    await lottery.save();
    return lottery;
}

async function moveToLotteryWallet(lottery, tx) {
    const balance = await MinterWallet.getBalance(tx.wallet.address);
    if(balance < 0.02){
        tx.wallet.balance = 0;
        tx.wallet.save();
        return;
    }
    if (balance > tx.data.value * config.referralPercent && tx.wallet.user.parent && tx.wallet.user.parent.paymentAddress) {
        const address = tx.wallet.user.parent.paymentAddress;
        const paymentTx = await MinterWallet.send(address, tx.wallet.seed, tx.data.value * config.referralPercent, config.appName + '. Referral payment');
        if (paymentTx.error) {
            logger.error(paymentTx);
            return;
        }
    }
    const paymentTx2 = await MinterWallet.sendAll(lottery.wallet.address, tx.wallet.seed);
    if (paymentTx2.error) {
        logger.error(paymentTx2);
        return;
    }
    tx.wallet.balance = await MinterWallet.getBalance(tx.wallet.address);
    tx.wallet.save();
}

centrifuge.on('connect', function (context) {
    logger.info('Centrifuge connected')
    // now client connected to Centrifugo and authorized
});



