import * as Callbacks from 'server/lib/callbacks';
import {Configurator} from 'server/lib/Configurator';
import mongoose from 'server/lib/mongoose';
import logger from "logat";

const t = require("server/i18n");
export default {}
export  class CB  {
    parseData(data) {
        const findModule = data.split('@');
        const module = findModule[0];
        const findAction = findModule[1].split('#');
        const action = findAction[0];
        const params = findAction[1];
        return {module, action, params}
    }

    async process(data, user) {
        const {module, action, params} = this.parseData(data);
        let error;
        if (!Callbacks[module]) return {error: `Wrong module "${module}"`};
        if (!Callbacks[module][action]) return {error: `Wrong action "${action}" for module "${module}"`};
        const response = await Callbacks[module][action]({params, user});
        const inline_keyboard = response.menu;
        /*response.menu = {
            parse_mode: "Markdown",
            reply_markup: {
                //keyboard: config.languageMenu,
                inline_keyboard: response.menu,
                //one_time_keyboard: false,
                //resize_keyboard: true,
            },
        };*/
        response.menu = response.noMarkdown ? {} : {parse_mode: "Markdown"};
        if (inline_keyboard && inline_keyboard.length) {
            response.menu.reply_markup = {inline_keyboard};
        }
        return response;

    }

    commands(){
        return {
            help: async ({msg, match, user, onlyDescription}) => {
                if (onlyDescription) return t('List of all available commands');
                let message = t('List of all available commands') + ':\n';
                for (const key in this.commands()) {
                    message += `/${key} - ${await this.commands()[key]({onlyDescription: true})}\n`;
                }
                const menu = [];
                return {message, menu};
            },

            list: async ({msg, match, user, onlyDescription}) => {
                if (onlyDescription) return t('All lotteries');
                return await this.process('lottery@listAll', user);
            },

            cabinet: async ({msg, match, user, onlyDescription}) => {
                if (onlyDescription) return t('Cabinet');
                const r =  await this.process('cabinet@start', user);
                logger.info(r)
                return r;
            },

            lottery: async ({msg, match, user, onlyDescription}) => {
                const help = t('Usage') + `: /lottery [${Configurator.getKeys().join('|')}]`;;
                if (onlyDescription) return
                const query = {network: match[1].trim(), finishTime:0}
                const lottery = await mongoose.Lottery.findOne(query);
                logger.info(lottery, query)
                if(!lottery) return {message: help};
                return await this.process('lottery@info#'+ lottery.id, user);
            },

        }
    }
}
