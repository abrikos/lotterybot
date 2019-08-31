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
    if (tx.data.to === process.env.ADDRESS) {
        console.log(tx)
        await mongoose.Transaction.createNew(tx)
    }
});


centrifuge.on('connect', function (context) {
    logger.info('Centrifuge connected')
    // now client connected to Centrifugo and authorized
});



