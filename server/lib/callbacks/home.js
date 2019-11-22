import {Configurator} from "server/lib/Configurator";
const t = require("server/i18n");
const noMarkdown =  true;

export default {
    async start(){
        const message = t('Main menu');
        const menu = [
            [
                {text: t('Supported crypto currencies'), callback_data: 'home@cryptoList'},

            ],
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
        let message = t('List of supported crypto currencies') +':\n\n'
            for(const net of Configurator.getNetworks()){
                message += net.name +'\n';
                message += t('Coin') + ': ' + net.coin +'\n';
                message += net.home +'\n';
                message += t('Wallet') + ': '+  net.wallet +'\n';
                if(net.faucet) message+= t('Get coins for free') +': '+ net.faucet+'\n';
                message+='------------------------\n\n';
            }
        const menu = [
            [
                {text: t('Main menu'), callback_data: 'home@start'},

            ]
        ];
        return {message, menu, noMarkdown}

    },

    async group(){
        let group = Configurator.getGroupName();
        const message = t('Join official group') + `: https://t.me/${group}`;

        const menu = [
            [
                {text: t('Back'), callback_data: 'home@start'},

            ]
        ];
        return {message, menu, noMarkdown}
    }
}

