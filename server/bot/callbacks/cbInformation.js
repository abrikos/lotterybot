const mongoose = require("../../lib/mongoose");
const t = require("../../i18n");
export default {
    level: 1,
    drawMenu: true,
    getLabel: () => t("Information"),
    getMessage: async () => {
        const sum = await mongoose.Transaction.bank();
        const message = t('intro')
            + '\n' + t('To buy ticket please send any amount of BIP to this address')
            + '\n' + `*${process.env.ADDRESS}*`
            + '\n' + t('1 BIP = 1 ticket')
            + '\n'
            //+ '\n' + t('Lottery ends') + `: *${moment().to(day)}*`
            + '\n' + t('Lottery will end upon reaching Bank') + `: 100 BIP`
            + '\n' + t('Current bank') + `: *${sum}* BIP`

            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'

        return message;
    }
}