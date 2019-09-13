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


function getMainMenu(user) {
    i18n.setLocale(user.language_code);
    const levels = [...new Set(Object.keys(CallBacks).map(key => CallBacks[key].level))].sort();
    const menu = {};
    for (const level of levels) {
        if (!menu[level]) menu[level] = [];
        for (const callback_data of Object.keys(CallBacks)) {
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
bot.onText(/\/start/, (msg, match) => {
    i18n.setLocale(msg.from.language_code);
    mongoose.User.findOrCreate(msg.from, async (error, user) => {
        const message = await CallBacks.information.getMessage();
        const langOptions = {
            reply_markup: {
                keyboard: [
                    config.languages.map(l => l.title)
                ],
                resize_keyboard: true,
            },
        };
        await bot.sendMessage(msg.chat.id, 'Hello!', langOptions);
        await bot.sendMessage(msg.chat.id, message, getMainMenu(user));
    });
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

            bot.sendMessage(chatId, CallBacks.setAddress.getSuccessMessage(), getMainMenu(user));
        } else {
            bot.sendMessage(chatId, CallBacks.setAddress.getWrongMessage());
        }
    } else {
        if (config.languages.map(l => l.title).indexOf(msg.text) > -1) {
            const lang = config.languages.find(l => l.title === msg.text);
            user.language_code = lang.language_code;
            user.save();
            i18n.setLocale(user.language_code);
            bot.sendMessage(msg.chat.id, await CallBacks.information.getMessage(), getMainMenu(user));
        }
    }
    // send a message to the chat acknowledging receipt of their message

});

bot.on('callback_query', async function (callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const user = await mongoose.User.findOne({id: callbackQuery.from.id});
    const message = await CallBacks[action].getMessage(user);
    //getMainMenu().parse_mode = "Markdown";
    await bot.sendMessage(msg.chat.id, message, CallBacks[action].drawMenu ? getMainMenu(user) : {});
});

