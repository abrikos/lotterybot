const mongoose = require("../../lib/mongoose");
const t = require("../../i18n");
const config = require('../../../client/lib/config');
const moment = require('moment')
export default {
    level: 0,
    drawMenu: true,
    getLabel: () => t("Information"),
    getMessage: async (user) => {
        const lottery = await mongoose.Lottery.getCurrent();
        const tickets = await user.ticketsCount();
        const lotteryTickets = await lottery.ticketsCount();
        const message = t('intro')
            + '\n' + t('To buy ticket please send any amount of BIP to this address')
            + '\n' + `*${user.wallet.address}*`
            + '\n' + t('1 BIP = 1 ticket')
            + '\n'
            + '\n' + t('Lottery starts') + `: *${moment(lottery.startTime).format('YYYY-MM-DD HH:mm')}*`

            + '\n' + t('The lottery will end when the balance of it wallet reaches') + `: *${Math.ceil(config.lotteryStopSum / config.lotteryPercent)}* BIP`
            + '\n' + t('Current lottery balance') + `: *${lottery.wallet.balance.toFixed(2)}* BIP`
            + '\n' + t('Lottery wallet') + `: *${await lottery.getLotteryLink()}*`
            + '\n' + t('Your have tickets') + `:* ${tickets}*`
            + '\n' + t('Total tickets') + `:* ${lotteryTickets}*`

            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'

        return message;
    }
}