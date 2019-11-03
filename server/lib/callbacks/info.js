import Configurator from "server/lib/Configurator";

const t = require("server/i18n");

export default {
    async process(args) {
        return await this[args.action]()
    },

    async start(){
        const message = t('Main menu');
        const menu = [
            [
                {text: t('List of supported crypto currencies'), callback_data: 'info@cryptoList'},

            ],
            [
                {text: t('Cabinet'), callback_data: 'cabinet@start'},
                {text: t('Lotteries'), callback_data: 'lottery@start'},
            ]
        ];
        return {message, menu, editMessage: false}
    },

    async cryptoList(){
        const message = t('List of supported crypto currencies') +':\n'+ Configurator.getNetworks().map(n=>n.name).join(',\n');
        const menu = [
            [
                {text: t('Main menu'), callback_data: 'info@start'},

            ]
        ];
        return {message, menu}

    }
}

