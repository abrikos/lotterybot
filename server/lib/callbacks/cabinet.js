import Configurator from "server/lib/Configurator";
import mongoose from "server/lib/mongoose";

const t = require("server/i18n");
export default {
    async process(args) {
        return await this[args.action](args);
    },

    async start() {
        const message = t('Cabinet');
        const menu = [
            [
                {text: t('My referral addresses'), callback_data: 'cabinet@addresses'},

            ],
            [
                {text: t('Lotteries'), callback_data: 'cabinet@lotteries'},
                {text: t('Bets'), callback_data: 'cabinet@bets'},
            ],
            [{text: t('Back'), callback_data: 'info@start'},]
        ];
        return {message, menu, replacePrev: true}

    },

    async addresses(args) {
        let message = t('Set the addresses for each cryptocurrency to which referral deductions will be sent to you');
        const menu = [];
        for (const network of Configurator.networks) {
            const address = args.user.addresses.find(a => a.network === network.key);
            let text, callback_data;
            if (address) {
                text = address.address + ` (${network.name})`;
                callback_data = 'cabinet@setAddress#' + network.key;
            } else {
                text = t('Add address for') + ` ${network.name}`;
                callback_data = 'cabinet@setAddress#' + network.key;
            }
            menu.push([{text, callback_data}])
        }
        menu.push([{text: t('Back'), callback_data: 'cabinet@start'}])
        return {message, menu, replacePrev: true}
    },

    async setAddress(args) {
        args.user.waitForReferralAddress = args.params;
        args.user.save();
        const message = t('Enter new referral address for') + Configurator.getNetwork(args.params).name;
        //const start = await this.start();
        //const menu = start.menu;
        return {message, menu:[], replacePrev: false}
    },

    async bets(args) {
        const message = '';
        const menu = [];
        return {message, menu, replacePrev: false}
    },

    async lotteries(args) {
        const message = '';
        const menu = [];
        return {message, menu, replacePrev: false}
    },
}

