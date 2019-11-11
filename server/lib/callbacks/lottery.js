import {Configurator} from "server/lib/Configurator";
import mongoose from 'server/lib/mongoose'

const logger = require('logat');

const t = require("server/i18n");
export default {
    async process(args) {
        return await this[args.action](args);
    },

    async listAll(args) {
        let message = t('List of lotteries');
        const lotteries = await mongoose.Lottery.find({finishTime: 0}).populate(mongoose.Lottery.population);
        const menu = [];
        for (const l of lotteries.filter(l => Configurator.getNetworks().map(n => n.key).indexOf(l.network) > -1)) {
            const App = new Configurator(l.network);
            menu.push([{text: l.balance.toFixed(App.network.toFixed) +' '+ App.network.coin + ' - ' + App.network.name, callback_data: 'lottery@info#' + l.id}]);
        }
        menu.push([{text: t('Back'), callback_data: 'home@start'}]);
        return {message, menu}
    },

    async info(args) {
        const lottery = await mongoose.Lottery.findById(args.params).populate(mongoose.Lottery.population);
        const App = new Configurator(lottery.network);
        let message = `${App.lotteryInfo(lottery)}\n`;
        if (args.user) {
            let userWallet = args.user.wallets.find(w => w.network === lottery.network);
            if(!userWallet) userWallet = await App.createWallet(args.user);
            message += `\n${t('To participate in the lottery, send any amount to the address')} \`${userWallet.address}\`\n`
            message += `${t('Your current chances')} *: ${(userWallet.getBalance(lottery._id) / (lottery.balance || 1) * 100).toFixed(0)}%*\n--------------------\n\n`
        }
        const menu = [];
        return {message, menu}
    }

}

