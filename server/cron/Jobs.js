import MinterWallet from "../lib/MinterWallet";

const AuctionUtils = require("../lib/AuctionUtils");

const mongoose = require('../lib/mongoose');
const config = require("../../client/lib/config");
const moment = require('moment');
const to = require('../lib/to');
const logger = require('logat');
//const MinterWallet = require('./MinterWallet');
const randomWords = require('random-words');
const hostConfig = require("../../client/lib/host.config.local");
const NET = config[hostConfig.net];


const nodemailer = require('nodemailer');
const mailer = JSON.parse(process.env.mailer);
const transporter = nodemailer.createTransport({direct: true, host: mailer.host, port: mailer.port, auth: mailer.auth});

const TelegramBotApi = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent')
const TeleBot = new TelegramBotApi(process.env.TELE_BOT, {
    polling: false, request: {
        agentClass: Agent,
        agentOptions: {
            socksHost: process.env.PROXY_SOCKS5_HOST,
            socksPort: parseInt(process.env.PROXY_SOCKS5_PORT),
            // If authorization is needed:
            // socksUsername: process.env.PROXY_SOCKS5_USERNAME,
            // socksPassword: process.env.PROXY_SOCKS5_PASSWORD
        }
    }
});

export default {

    lostTransactions: async function () {
        const wallets = await mongoose.Wallet.find({closed: false});
        for (const wallet of wallets) {
            console.log(wallet.address)
            const balance = await MinterWallet.getBalance(wallet.address);
            if (balance.error) return logger.info(balance);
            if (!balance) return logger.info('Not balance', wallet.address);
            //if(wallet.address==='Mx1376804b4fe08dbd6ff78ad835f8ac04482055be') logger.info(balance)

            wallet.balance = balance;
            await wallet.save();


            const txs = await MinterWallet.loadTransactions(wallet.address);
            if (txs.error) return logger.info(txs);
            const mytxs = await mongoose.Transaction.find();

            const newtxs = txs.filter(tx => mytxs.map(t => t.hash).indexOf(tx.hash) === -1 && [1, 13].indexOf(tx.type) !== -1);
            for (const tx of newtxs) {
                await this.addTransactionToWallet(wallet, tx)
            }


        }

    },

    addTransactionToWallet: async function (wallet, tx) {
        let toMain;
        const mainAddr = MinterWallet.mainAddress();
        if (tx.type === 13) {
            toMain = tx.data.list.find(a => a.to === mainAddr);
            for (const pay of tx.data.list.filter(p => (p.to === wallet.address) && (p.coin === NET.symbol))) {
                wallet.amount += pay.value * 1;

            }
        } else if (tx.type === 1) {
            toMain = tx.data.to === mainAddr;
            if (wallet.address === tx.data.to) {
                wallet.amount += tx.value;
            }
        } else {
            return logger.error('WRONG TX.type', tx);
        }

        await wallet.save();
        tx.wallet = wallet;
        tx.toMain = !!toMain;
        const newtx = await mongoose.Transaction.createNew(wallet, tx);
        const models = ['Quest', 'QuestStep'];
        for (const modelName of models) {
            const model = await mongoose[modelName].findOne({wallet: wallet.id});
            if (!model) continue;
            model.txPayed = newtx.hash;
            await model.save();
        }
    },




    sendMessages: async function () {
        const messages = await mongoose.Message.find({sent: null}).populate('to')

        for (const message of messages) {
            if (!message.to) continue;
            const {telegramId, username} = message.to;
            if (telegramId) {
                const [e1] = await to(TeleBot.sendMessage(telegramId, message.text))
                if (e1) {
                    logger.error(e1)
                } else {
                    message.sent = new Date().valueOf();
                    await message.save()
                }

            } else if (username) {
                const mailOptions = {from: mailer.from, to: username, subject: config.appName + ': Notification', text: message.text};
                const [e2] = await to(transporter.sendMail(mailOptions))
                if (e2) {
                    logger.error(e2)
                } else {
                    message.sent = new Date().valueOf();
                    await message.save()
                }
            }
        }
    },



}
