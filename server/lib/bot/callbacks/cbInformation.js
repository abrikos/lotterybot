const mongoose = require("server/lib/mongoose");
const t = require("server/i18n");
const config = require('client/lib/config');

export default {
    level: 0,
    drawMenu: true,
    parent: 'root',
    getLabel: () => t("Information"),
    getMessage: async (user) => {
        const lottery = await mongoose.Lottery.getCurrent();
        const tickets = await user.ticketsCount();
        const message =  (await lottery.getInfo())
            + '\n---------------'
            + '\n' + t('To buy ticket please send any amount of BIP to this address')
            + '\n' + `*${user.wallet.address}*`
            + '\n' + t('1 BIP = 1 ticket')
            + '\n' + t('Your have tickets') + `:* ${tickets}*`
            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'

        return message;
    }
}