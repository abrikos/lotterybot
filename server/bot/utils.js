const t = require("../i18n");
const buttons = require("./buttons");
const mongoose = require("../lib/mongoose");
const moment = require('moment')

module.exports = {
    translateMenu: (menu) => {
        return menu.map(rows => rows.map(cols => {
            const {text, ...rest} = cols;
            //console.log(text, t(text), rest)
            return {text: t(text), ...rest}
        }))
    },

    mainMenu() {
        return {
            reply_markup: {
                //keyboard: utils.translateMenu(buttons.mainMenu),
                inline_keyboard: this.translateMenu(buttons.mainMenu),
                //one_time_keyboard: false,
                //resize_keyboard: true,
            },
        }
    },

    getIntro: async ()=> {
        const day = moment().endOf( 'days')
        console.log(day, moment().to(day))

        const sum = await mongoose.Transaction.bank();
        return t('intro')
            + '\n' + t('To buy ticket please send any amount of BIP to this address')
            + '\n' + `*${process.env.ADDRESS}*`
            + '\n' + t('1 BIP = 1 ticket')
            + '\n'
            + '\n' + t('Lottery ends') + `: *${moment().to(day)}*`
            + '\n' + t('Current bank') + `: *${sum}* BIP`

            + '\n---------------'
            + '\n' + t('Support') + ': @abrikostrator'
    }
};

