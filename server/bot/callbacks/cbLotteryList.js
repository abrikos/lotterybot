import logger from "i18next/dist/es/logger";

const mongoose = require("../../lib/mongoose");
const t = require("../../i18n");
const moment = require('moment');


export default {
    level: 0,
    drawMenu: true,
    getLabel: () => t("List of lotteries"),
    getMessage: async (user) => {
        const lotteries = await mongoose.Lottery.getAll();
        let list = '\n';
        for (const l of lotteries) {
            try {
                //const tickets = await l.ticketsCount();
                const link = await l.getLotteryLink();
                const winnerTx = await l.getWinnerLink();
                list += (l.finishTime ?
                    `\n${t('Finished')} *${moment(l.finishTime).format('YYYY-MM-DD HH:mm')}*\n${t('Winner')}: ${winnerTx}`
                    :
                    `\n*${t('Current')}*`) + `\n${t('Transactions')}: ${link}\n====================================\n`

                ;
            } catch (e) {
                logger.error(e)
            }
        }
        const message = t('List of lotteries')
            + '\n' + list

        return message;
    }
}