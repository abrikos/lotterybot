const mongoose = require("server/lib/mongoose");
const t = require("server/i18n");
const config = require('client/lib/config');

export default {
    level: 0,
    drawMenu: true,
    parent: 'root',
    getLabel: () => t("Information"),
    getMessage: async (user) => {
        const message =  t('intro')
            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'

        return message;
    }
}