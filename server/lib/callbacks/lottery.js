import Configurator from "server/lib/Configurator";
import mongoose from 'server/lib/mongoose'
const t = require("server/i18n");
export default {
    async process(args) {
        return await this[args.action]();
    },

    async start(){
        let message = t('List of lotteries') + '\n=======================\n\n';
        const lotteries = await mongoose.Lottery.find({finishTime:0}).populate(mongoose.Lottery.population);
        for(const l of lotteries){
            message += `${await l.getInfo()}\n--------------------\n\n`
        }
        const menu = [
            [
                {text: t('Main menu'), callback_data: 'info@start'},

            ]
        ];
        return {message, menu}
    },

}

