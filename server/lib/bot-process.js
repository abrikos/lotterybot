import * as CallBacks from "server/lib/bot/callbacks"
import Callback from "server/lib/Callback"
import {Configurator} from "server/lib/Configurator"


const i18n = require("i18n");
const t = require("server/i18n");
const mongoose = require("server/lib/mongoose");

//const config = require("server/config");


export default {
    init: (bot) => {
//Chat messages

/*
BotFather commands list:

lotteries - List of active lotteries
winners - List of winners
paymentaddresses - List of your addresses for participating in each of the active lotteries
*/
        this.App = new Configurator('minter-mnt');
        bot.onText(/\/winners/, async (msg, match) => {
            const lottery = await mongoose.Lottery.getCurrent();
            await bot.sendMessage(msg.chat.id, lottery.info, {parse_mode: "Markdown"});
        });

        bot.onText(/\/paymentaddresses/, async (msg, match) => {
            const user = await this.App.getUser(msg.from);
            const response = await Callback.process('cabinet@lotteryAddresses', user);
            await bot.sendMessage(msg.from.id, response.message, {parse_mode: "Markdown"});
        });

        bot.onText(/\/lotteries/, async (msg, match) => {
            //const user = await this.App.getUser(msg.from);
            const response = await Callback.process('lottery@listAll');
            await bot.sendMessage(msg.chat.id, response.message, {parse_mode: "Markdown"});
        });

        bot.onText(/\/list/, async (msg, match) => {
            const user = await this.App.getUser(msg.from);
            const response = await Callback.process('lottery@listAll', user);
            await bot.sendMessage(msg.from.id, response.message, {parse_mode: "Markdown"});
        });

        bot.onText(/\/start(.*)/, async (msg, match) => {
            const user = await this.App.getUser(msg.from);
            i18n.setLocale(user.language_code);
            if (mongoose.Types.ObjectId.isValid(match[1].trim()) && !user.parent) {
                user.parent = await mongoose.User.findById(match[1].trim());
                await user.save();
            }
            i18n.setLocale(user.language_code);
            const keyboard = [];
            const firstLine = Configurator.getConfig().languages.map(l => l.title);
            //firstLine.push('🏠');
            keyboard.push(firstLine);

            const langOptions = {
                reply_markup: {
                    keyboard,
                    resize_keyboard: true,
                },
            };

            const response = await Callback.process('cabinet@addresses', user);
            bot.sendMessage(msg.from.id, response.message, response.menu);
            bot.sendMessage(msg.from.id, t('Start main menu by choosing language'), langOptions);
        });


//Private messages
        bot.on('message', async (msg) => {
            if(!msg.text) return;
            if(msg.text.match(/^\//)) return;
            if (msg.from.id !== msg.chat.id) return;
            const user = await this.App.getUser(msg.from);
            i18n.setLocale(user.language_code);
            const sendToId = msg.from.id;

            if (user.waitForReferralAddress) {
                const app = new Configurator(user.waitForReferralAddress)
                const result = this.App.setReferralAddress(user, msg.text)
                if (!result.error) {
                    const response = await Callback.process('cabinet@start', user);
                    bot.sendMessage(sendToId, t('New address set for') + ` ${result.network.name}: *${msg.text}*`, response.menu);
                } else {
                    const response = await Callback.process('cabinet@errorSetAddress#'+result.network.name, user);
                    bot.sendMessage(sendToId, response.message, response.menu);
                }

            }
            else if (Configurator.getConfig().languages.map(l => l.title).indexOf(msg.text) > -1) {

                const lang = Configurator.getConfig().languages.find(l => l.title === msg.text);
                user.language_code = lang.language_code;
                i18n.setLocale(user.language_code);
                user.save();
                const response = await Callback.process('home@start');
                bot.sendMessage(sendToId, response.message, response.menu);

            }
        });

        bot.on('callback_query', async function (callbackQuery) {
            const user = await this.App.getUser(callbackQuery.from);
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

    },


}
