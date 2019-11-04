import {Configurator} from "server/lib/Configurator";
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
                {text: t('My referral link'), callback_data: 'cabinet@reflink'},

            ],
            [
                {text: t('My referral addresses'), callback_data: 'cabinet@addresses'},

            ],
            [
                {text: t('Referrals'), callback_data: 'cabinet@referrals'},
                {text: t('Bets'), callback_data: 'cabinet@bets'},
            ],
            [{text: t('Back'), callback_data: 'home@start'},]
        ];
        return {message, menu, replacePrev: true}

    },

    async addresses(args) {
        let message = t('Set the addresses for each cryptocurrency to which referral deductions will be sent to you');
        const menu = [];
        for (const network of Configurator.getKeys()) {
            const App = new Configurator(network);
            const address = args.user.addresses.find(a => a.network === App.network.key);
            let text, callback_data;
            if (address) {
                text = address.address + ` (${App.network.name})`;
                callback_data = 'cabinet@setAddress#' + App.network.key;
            } else {
                text = t('Add address for') + ` ${App.network.name}`;
                callback_data = 'cabinet@setAddress#' + App.network.key;
            }
            menu.push([{text, callback_data}])
        }
        menu.push([{text: t('Back'), callback_data: 'cabinet@start'}])
        return {message, menu, replacePrev: false}
    },

    async setAddress(args) {
        const App = new Configurator(args.params);
        args.user.waitForReferralAddress = args.params;
        args.user.save();
        const message = t('Enter new referral address for') + App.getNetwork().name;
        //const start = await this.start();
        //const menu = start.menu;
        return {message, menu:[], replacePrev: false}
    },

    async bets(args) {
        const message = '';
        const menu = [];
        return {message, menu, replacePrev: false}
    },

    async referrals(args) {
        const message = '';
        const menu = [];
        return {message, menu, replacePrev: false}
    },

    async reflink(args) {
        const message = t('Use this link to invite new members')
            + `:\n ${args.user.referralLink}\n `
        +t('Do not forget to fill out the referral addresses where interest will be sent.');
        const menu = [
            [{text: t('My referral addresses'), callback_data: 'cabinet@addresses'}],
            [{text: t('Back'), callback_data: 'cabinet@start'}]
        ];
        return {message, menu, replacePrev: false, noMarkdown: true}
    },

    async cancelSetAddress(args) {
        args.user.waitForReferralAddress = false;
        args.user.save();
        const message = t('Change referral address canceled');
        const start =  await this.start(args)
        const menu = start.menu;
        return {message, menu, replacePrev: true}
    },

    async errorSetAddress(args) {
        const message = t('Wrong address for network') + ` *${args.params}*`;
        const menu = [
            [{text: t('Cancel'), callback_data: 'cabinet@cancelSetAddress'}]
        ];
        return {message, menu, replacePrev: false}
    },

    async lotteryAddresses(args) {

        let message = t('List of your addresses for payment') + '\n=======================\n';
        const lotteries = await mongoose.Lottery.find({finishTime: 0}).populate(mongoose.Lottery.population);
        for (const l of lotteries.filter(l => Configurator.getKeys().indexOf(l.network) > -1)) {
            const App = new Configurator(l.network);
            message += `${App.getNetwork().name}\n`;
            if(args.user) {
                const userWallet = args.user.wallets.find(w => w.network === l.network)
                message += `*${userWallet.address}*\n`
                message += `--------------------\n\n`
            }
        }
        const menu = [];
        return {message, menu, replacePrev: false}
    },
}

