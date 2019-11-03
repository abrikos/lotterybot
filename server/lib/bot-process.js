import * as CallBacks from "server/lib/bot/callbacks"
import Callback from "server/lib/Callback"
import Configurator from "server/lib/Configurator"


const i18n = require("i18n");
const t = require("server/i18n");
const mongoose = require("server/lib/mongoose");

//const config = require("server/config");


export default {
    init: (bot) => {
//Chat messages
        const BotProcess = this.default;
        bot.onText(/\/info/, async (msg, match) => {
            const lottery = await mongoose.Lottery.getCurrent();
            const message = await lottery.getInfo()
            await bot.sendMessage(msg.chat.id, message, {parse_mode: "Markdown"});
        });

        bot.onText(/\/myaddress/, async (msg, match) => {
            const user = await mongoose.User.getUser(msg.from);
            i18n.setLocale(user.language_code);
            const message = t('To buy tickets please send any amount of  BIP to') + `*${user.wallet.address}*`;
            await bot.sendMessage(msg.from.id, message, {parse_mode: "Markdown"});
        });

        bot.onText(/\/start(.*)/, async (msg, match) => {
            const user = await mongoose.User.getUser(msg.from);
            i18n.setLocale(user.language_code);
            if (mongoose.Types.ObjectId.isValid(match[1].trim()) && !user.parent) {
                user.parent = await mongoose.User.findById(match[1]);
                await user.save();
            }
            i18n.setLocale(user.language_code);
            const keyboard = [];
            const firstLine = Configurator.config.languages.map(l => l.title);
            firstLine.push('🏠');
            keyboard.push(firstLine);

            const langOptions = {
                reply_markup: {
                    keyboard,
                    resize_keyboard: true,
                },
            };
            bot.sendMessage(msg.from.id, 'Choose language', langOptions);
        });


//Private messages
        bot.on('message', async (msg) => {
            if(msg.text.match(/^\//)) return;
            if (msg.from.id !== msg.chat.id) return;
            const user = await mongoose.User.getUser(msg.from);
            i18n.setLocale(user.language_code);
            const sendToId = msg.from.id;

            if (user.waitForReferralAddress) {
                const result = user.setReferralAddress(msg.text)
                if (!result.error) {
                    const response = await Callback.process('cabinet@start', user);
                    bot.sendMessage(sendToId, t('New address set for') + ` ${result.network.name}: *${msg.text}*`, response.menu);
                } else {
                    bot.sendMessage(sendToId, t('Wrong address for network') + ` *${result.network.name}*`, {parse_mode: "Markdown"});
                }

            }
            else if (Configurator.config.languages.map(l => l.title).indexOf(msg.text) > -1) {

                const lang = Configurator.config.languages.find(l => l.title === msg.text);
                user.language_code = lang.language_code;
                i18n.setLocale(user.language_code);
                user.save();
                const response = await Callback.process('info@start');
                bot.sendMessage(sendToId, response.message, response.menu);

            }
        });

        bot.on('callback_query', async function (callbackQuery) {
            const user = await mongoose.User.getUser(callbackQuery.from);
            i18n.setLocale(user.language_code);
            const msg = callbackQuery.message;
            const response = await Callback.process(callbackQuery.data, user);
            if (response.replacePrev) {
                await bot.editMessageText(response.message, {chat_id: msg.chat.id, message_id: msg.message_id});
                await bot.editMessageReplyMarkup(response.menu.reply_markup, {chat_id: msg.chat.id, message_id: msg.message_id});
            } else {
                await bot.sendMessage(msg.chat.id, response.message, response.menu);
            }

        });

        /*
                bot.on('callback_query', async function (callbackQuery) {
                    console.log(callbackQuery)
                    const action = callbackQuery.data;
                    const msg = callbackQuery.message;
                    const user = await mongoose.User.getUser(callbackQuery.from);
                    i18n.setLocale(user.language_code);
                    const message = await CallBacks[action].getMessage(user);
                    //getMenu().parse_mode = "Markdown";
                    await bot.sendMessage(msg.chat.id, message, CallBacks[action].drawMenu ? BotProcess.getMenu(user, action) : {});
                });

        */

    },

    getMenu() {
        const menu = [];
        const networksMenu = []
        for (const network in Configurator.networks) {
            networksMenu.push({text: Configurator.getNetwork(network).name, callback_data: `networks@${network}`})
        }
        menu.push(networksMenu);
        return {
            parse_mode: "Markdown",
            reply_markup: {
                //keyboard: config.languageMenu,
                inline_keyboard: menu,
                //one_time_keyboard: false,
                //resize_keyboard: true,
            },
        };
    },

    getMenuBAK(user, parent) {
        if (!parent) parent = 'root';
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


}
