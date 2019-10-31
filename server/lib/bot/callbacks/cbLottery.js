const mongoose = require("server/lib/mongoose");
const t = require("server/i18n");
const config = require('client/lib/config');

export default {
    level: 0,
    drawMenu: true,
    parent: 'root',
    getLabel: () => t("Information"),
    getMessage: async (coin, user) => {
        const lottery = await mongoose.Lottery.getCurrent(coin);
        const tickets = await user.ticketsCount(lottery);
        const message =  (await lottery.getInfo())
            + '\n---------------'
            + '\n' + t('To buy ticket please send any amount of BIP to this address')
            + '\n' + `*${user.getWallet(coin).address}*`
            + '\n' + t('1 BIP = 1 ticket')
            + '\n' + t('Your have tickets') + `:* ${tickets}*`
            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'

        return message;
    }
}