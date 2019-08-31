const TelegramBot = require('node-telegram-bot-api');
const i18n = require("i18n");
const mongoose = require("../lib/mongoose");
const t = require("../i18n");
const moment = require('moment')
const utils = require("./utils");
const Agent = require('socks5-https-client/lib/Agent');
require('dotenv').config()
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_KEY;

const walletAddressRegexp = /^Mx[a-fA-F0-9]{40}$/;


// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
    polling: true,
    request: {
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


// Matches "/echo [whatever]"
bot.onText(/\/start/, async (msg, match) => {
    //i18n.setLocale(msg.from.language_code);
    i18n.setLocale('ru');
    moment.locale(msg.from.language_code);
    const options = utils.mainMenu();
    options.parse_mode = "Markdown";
    mongoose.User.findOrCreate(msg.from, (error, user) => {

    });
    const message = await utils.getIntro();
    bot.sendMessage(msg.chat.id, message, options);
});

/*
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});
*/

// Listen for any kind of message. There are different kinds of
// messages.

bot.on('message', async (msg) => {

    const user = await mongoose.User.findOne({id: msg.from.id});
    const chatId = msg.chat.id;
    if (user.changeAddress) {
        if (msg.text.match(walletAddressRegexp)) {
            user.wallet = msg.text;
            user.changeAddress = false;
            user.save();
        } else {
            bot.sendMessage(chatId, t('Wrong address'));
        }
    }
    // send a message to the chat acknowledging receipt of their message

});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const user = await mongoose.User.findOne({id: callbackQuery.from.id});

    let message;
    if (action === 'setAddress') {
        user.changeAddress = true;
        user.save();
        message = t('Enter Your address for payments');
    }

    if (action === 'information') {
        message = await utils.getIntro();
    }

    if (action === 'list') {
        const sum = await mongoose.Transaction.bank();
        const txs = await mongoose.Transaction.find({ended: false});
        message = t('Lottery of the day')
        message += `\nBank: *${sum.toFixed(2)}*\n`;
        message += '---------------------\n'
        message += `\`Address      \` *BIP (tickets)*\n`;
        for (const tx of txs) {
            message += `\`${tx.from.substring(0, 10)}...\` *${tx.value.toFixed(2)} (${(tx.value / sum * 100).toFixed(0)})*\n`
        }
        message += '---------------------\n'
        //message += await utils.getIntro();
    }

    const options = utils.mainMenu();
    options.parse_mode = "Markdown";
    bot.sendMessage(msg.chat.id, message, options);
    //if (text) bot.editMessageText(text, opts);
});