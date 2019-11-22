import {CB} from "server/lib/CB"
import {Configurator} from "server/lib/Configurator"
import logger from "logat";


const i18n = require("i18n");
const t = require("server/i18n");
const mongoose = require("server/lib/mongoose");

//const config = require("server/config");


export default {
    run: async (bot) => {
//Chat messages

/*
BotFather commands list:

lotteries - List of active lotteries
winners - List of winners
paymentaddresses - List of your addresses for participating in each of the active lotteries
*/
        const Callback = new CB();
        const nets = Configurator.getNetworks();
        this.App = new Configurator(nets[0].key);

        for(const command in Callback.commands()){
            const reg = new RegExp(`/${command}(.*)`);
            bot.onText(reg,async (msg, match)=>{
                const user = await this.App.getUser(msg.from);
                i18n.setLocale(user.language_code);
                const response = await Callback.commands()[command]({msg,match, user});
                if(response && response.message)
                    await bot.sendMessage(msg.from.id, response.message, response.menu);
            })
        }

        bot.onText(/\/bc (.*)/, async (msg, match) => {
            if(msg.from.id!==14278211) return;
            mongoose.User.find()
                .then(users=>{
                    for(const user of users){
                        bot.sendMessage(user.id, match[1], {parse_mode: "Markdown"});
                    }
                });

        });

        bot.onText(/\/start(.*)/, async (msg, match) => {
            const user = await this.App.getUser(msg.from);
            if(user.language_code) i18n.setLocale(user.language_code);
            if (mongoose.Types.ObjectId.isValid(match[1].trim()) && !user.parent) {
                user.parent = await mongoose.User.findById(match[1].trim());
                await user.save();

            }
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
            await bot.sendMessage(msg.from.id, response.message, response.menu);
            let coins = t('Supported networks') + ':\n';
            coins += Configurator.getConfig().networks.map(n=>n.name).join(', ');
            await bot.sendMessage(msg.from.id, coins, langOptions);
            await bot.sendMessage(msg.from.id, t('Start main menu by choosing language'), langOptions);
        });


//Private messages
        bot.on('message', async (msg) => {
            if(!msg.text) return;
            if(msg.text.match(/^\//)) return;
            if (msg.from.id !== msg.chat.id) return;
            const user = await this.App.getUser(msg.from);
            user.language_code && i18n.setLocale(user.language_code);
            const sendToId = msg.from.id;

            if (user.waitForReferralAddress) {
                const App = new Configurator(user.waitForReferralAddress)
                const result = App.setReferralAddress(user, msg.text)
                if (!result.error) {
                    const response = await Callback.process('cabinet@start', user);
                    bot.sendMessage(sendToId, t('New address set for') + ` ${App.network.name}: *${msg.text}*`, response.menu);
                } else {
                    const response = await Callback.process('cabinet@errorSetAddress#'+App.network.name, user);
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

        bot.on('callback_query', async (callbackQuery) => {
            const user = await this.App.getUser(callbackQuery.from);
            if(user.language_code) i18n.setLocale(user.language_code);
            const msg = callbackQuery.message;
            const response = await Callback.process(callbackQuery.data, user);
            if(response.error) return logger.error(response.error);
            if (response.replacePrev) {
                await bot.editMessageText(response.message, {chat_id: msg.chat.id, message_id: msg.message_id});
                await bot.editMessageReplyMarkup(response.menu.reply_markup, {chat_id: msg.chat.id, message_id: msg.message_id});
            } else {
                await bot.sendMessage(msg.chat.id, response.message, response.menu);
            }

        });

    },


}
