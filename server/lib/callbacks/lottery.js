import {Configurator} from "server/lib/Configurator";
import mongoose from 'server/lib/mongoose'

const t = require("server/i18n");
export default {
    async process(args) {
        return await this[args.action](args);
    },

    async listAll(args) {
        let message = t('List of lotteries') + '\n=======================\n\n';
        const lotteries = await mongoose.Lottery.find({finishTime: 0}).populate(mongoose.Lottery.population);

        for (const l of lotteries.filter(l => Configurator.getNetworks().map(n => n.key).indexOf(l.network) > -1)) {

            message += `${await l.getInfo()}\n`;
            if(args.user) {
                const userWallet = args.user.wallets.find(w => w.network === l.network)
                message += `${t('To participate in the lottery, send any amount to the address')} *${userWallet.address}*\n`
                message += `${t('Your current chances')} *${userWallet.ticketsCount.toFixed(2)}%*\n--------------------\n\n`
            }
        }
        const menu = [
            [
                {text: t('Back'), callback_data: 'home@start'},

            ]
        ];
        return {message, menu}
    },

}

