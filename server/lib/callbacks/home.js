import {Configurator} from "server/lib/Configurator";

const t = require("server/i18n");

export default {
    async process(args) {
        return await this[args.action]()
    },

    async start(){
        const message = t('Main menu');
        const menu = [
            [
                {text: t('Active lotteries'), callback_data: 'lottery@listAll'},

            ],
            [
                {text: t('Cabinet'), callback_data: 'cabinet@start'},

            ],
            [
                {text: t('Official group of bot'), callback_data: 'home@group'},
            ]
        ];
        return {message, menu, editMessage: false}
    },

    async cryptoList(){
        const message = t('List of supported crypto currencies') +':\n'+ Configurator.getNetworks().map(n=>n.name).join(',\n');
        const menu = [
            [
                {text: t('Main menu'), callback_data: 'home@start'},

            ]
        ];
        return {message, menu}

    },

    async group(){
        let group = Configurator.getGroupName();
        const message = t('Join official group') + `: https://t.me/${group}`;

        const menu = [
            [
                {text: t('Main menu'), callback_data: 'home@start'},

            ]
        ];
        return {message, menu, noMarkdown: true}
    }
}

