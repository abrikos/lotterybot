const mongoose = require("../../lib/mongoose");
const t = require("../../i18n");
const config = require('../../../client/lib/config');
export default {
    level: 0,
    drawMenu: true,
    getLabel: () => t("Information"),
    getMessage: async (user) => {
        const sum = await mongoose.Lottery.getBank();
        const message = t('intro')
            + '\n' + t('To buy ticket please send any amount of BIP to this address')
            + '\n' + `*${user.wallet.address}*`
            + '\n' + t('1 BIP = 1 ticket')
            + '\n'
            //+ '\n' + t('Lottery ends') + `: *${moment().to(day)}*`
            + '\n' + t('Lottery will end upon reaching Bank') + `: ${config.lotteryStopSum} BIP`
            + '\n' + t('Current bank') + `: *${sum}* BIP`

            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'

        return message;
    }
}