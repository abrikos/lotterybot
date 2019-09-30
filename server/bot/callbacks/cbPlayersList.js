const mongoose = require("../../lib/mongoose");
const t = require("../../i18n");
export default {
    level: 0,
    drawMenu: true,
    getLabel: () => t("\uD83D\uDCC4 List of tickets"),
    getMessage: async () => {
        const sum = await mongoose.Transaction.bank();
        const txs = await mongoose.Transaction.find({ended: false});
        let message = t('Lottery of the day')
        message += `\nBank: *${sum.toFixed(2)}*\n`;
        message += '---------------------\n'
        message += `\`Address      \` *BIP (tickets)*\n`;
        for (const tx of txs) {
            message += `\`${tx.from.substring(0, 10)}...\` *${tx.value.toFixed(2)} (${(tx.value / sum * 100).toFixed(0)})*\n`
        }
        message += '---------------------\n'
        //message += await utils.getIntro();
        return message;
    }
}