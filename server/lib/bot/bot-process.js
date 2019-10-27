import * as CallBacks from "server/lib/bot/callbacks"
import moment from "moment";
const i18n = require("i18n");
const t = require("server/i18n");
const mongoose = require("server/lib/mongoose");
const config = require("./config");
const walletAddressRegexp = /^Mx[a-fA-F0-9]{40}$/;


export default {
    init:(bot)=>{
//Chat messages
        const BotProcess = this.default;
        bot.onText(/\/info/, async (msg, match) => {
            const lottery = await mongoose.Lottery.getCurrent();
            const message =await lottery.getInfo()
            await bot.sendMessage(msg.chat.id, message, {parse_mode: "Markdown"});
        });

        bot.onText(/\/myaddress/, async (msg, match) => {
            const user = await mongoose.User.getUser(msg.from);
            i18n.setLocale(user.language_code);
            const message = t('To buy tickets please send any amount of  BIP to') + `*${user.wallet.address}*`;
            await bot.sendMessage(msg.from.id, message, {parse_mode: "Markdown"});
        });



//Private messages
        bot.on('message', async (msg) => {
            if (msg.from.id !== msg.chat.id) return;
            const user = await mongoose.User.getUser(msg.from);
            const sendToId = msg.from.id;
            const start = msg.text.match(/\/start (.+)/);
            if (start) {
                if (mongoose.Types.ObjectId.isValid(start[1]) && !user.parent) {
                    user.parent = await mongoose.User.findById(start[1]);
                    await user.save();
                }
                i18n.setLocale(user.language_code);
                if (!user.paymentAddress) {
                    await bot.sendMessage(sendToId, t('Please input your wallet address for referral payments'));
                } else {
                    await BotProcess.firstMessage(msg, user, bot)
                }
            } else if (!user.paymentAddress || user.changeAddress) {
                if (msg.text.match(walletAddressRegexp)) {
                    user.paymentAddress = msg.text;
                    user.changeAddress = false;
                    user.save();
                    await bot.sendMessage(sendToId, CallBacks.cbSetAddress.getSuccessMessage());
                    await BotProcess.firstMessage(msg, user, bot);
                } else {
                    await bot.sendMessage(sendToId, CallBacks.cbSetAddress.getWrongMessage());
                    if (user.paymentAddress) await bot.sendMessage(sendToId, t('Current address') + `\n*${user.paymentAddress}*`, {parse_mode: "Markdown"});
                    await bot.sendMessage(sendToId, t('Please input your wallet address for referral payments'));
                }

            } else {
                if (config.languages.map(l => l.title).indexOf(msg.text) > -1) {
                    const lang = config.languages.find(l => l.title === msg.text);
                    user.language_code = lang.language_code;
                    user.save();
                    i18n.setLocale(user.language_code);
                    bot.sendMessage(sendToId, await CallBacks.cbInformation.getMessage(user), BotProcess.getMenu(user));
                } else if (msg.text === '🏠') {
                    bot.sendMessage(sendToId, t('Main menu'), BotProcess.getMenu(user));
                } else {
                    bot.sendMessage(sendToId, await CallBacks.cbInformation.getMessage(user), BotProcess.getMenu(user));
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
            await bot.sendMessage(msg.chat.id, message, CallBacks[action].drawMenu ? BotProcess.getMenu(user, action) : {});
        });



    },

    getMenu(user, parent) {
        if(!parent) parent='root';
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
    },

    firstMessage(msg, user, bot){
        CallBacks.cbInformation.getMessage(user)
            .then(message=>{
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
                bot.sendMessage(msg.from.id, t('Hello!'), langOptions);
                bot.sendMessage(msg.from.id, message, this.getMenu(user));
            });

    }

}
