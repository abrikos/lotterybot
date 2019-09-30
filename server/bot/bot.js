import * as CallBacks from "./callbacks"

const TelegramBot = require('node-telegram-bot-api');
const i18n = require("i18n");
const mongoose = require("../lib/mongoose");
const t = require("../i18n");
const config = require("./config");
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


function getMenu(user, parent) {
    i18n.setLocale(user.language_code);
    const levels = [...new Set(Object.keys(CallBacks).map(key => CallBacks[key].level))].sort();
    const menu = {};
    for (const level of levels) {
        if (!menu[level]) menu[level] = [];
        for (const callback_data of Object.keys(CallBacks)) {
            if (CallBacks[callback_data].parent !== parent) continue;
            if (CallBacks[callback_data].level === level) {
                menu[level].push({
                    "text": CallBacks[callback_data].getLabel(),
                    callback_data
                })
            }
        }
    }
    return {
        parse_mode: "Markdown",
        reply_markup: {
            //keyboard: config.languageMenu,
            inline_keyboard: Object.keys(menu).map(key => menu[key]),
            //one_time_keyboard: false,
            //resize_keyboard: true,
        },
    };
}


// Matches "/echo [whatever]"
/*
bot.onText(/\/start/, async (msg, match) => {
    i18n.setLocale(msg.from.language_code);
    const user = await mongoose.User.getUser(msg.from);


});
*/

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
    const user = await mongoose.User.getUser(msg.from);
    const chatId = msg.chat.id;
    if (user.changeAddress) {
        if (msg.text.match(walletAddressRegexp)) {
            user.wallet = msg.text;
            user.changeAddress = false;
            user.save();

            bot.sendMessage(chatId, CallBacks.cbSetAddress.getSuccessMessage(), getMenu(user));
        } else {
            bot.sendMessage(chatId, CallBacks.cbSetAddress.getWrongMessage());
        }
    } else {
        if (config.languages.map(l => l.title).indexOf(msg.text) > -1) {
            const lang = config.languages.find(l => l.title === msg.text);
            user.language_code = lang.language_code;
            user.save();
            i18n.setLocale(user.language_code);
            bot.sendMessage(msg.chat.id, await CallBacks.cbInformation.getMessage(user), getMenu(user));
        } else if (msg.text === '🏠') {
            bot.sendMessage(msg.chat.id, t('Go to start'), getMenu(user));
        } else if(msg.text === '/start'){
            const message = await CallBacks.cbInformation.getMessage(user);
            const keyboard = [];
            const firstLine = config.languages.map(l => l.title);
            firstLine.push('🏠');
            keyboard.push(firstLine)
            const langOptions = {
                reply_markup: {
                    keyboard,
                    resize_keyboard: true,
                },
            };
            await bot.sendMessage(msg.chat.id, 'Hello!', langOptions);
            await bot.sendMessage(msg.chat.id, message, getMenu(user));
        }
    }
    // send a message to the chat acknowledging receipt of their message

});

bot.on('callback_query', async function (callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const user = await mongoose.User.getUser(callbackQuery.from);
    const message = await CallBacks[action].getMessage(user);
    //getMenu().parse_mode = "Markdown";
    await bot.sendMessage(msg.chat.id, message, CallBacks[action].drawMenu ? getMenu(user, action) : {});
});

