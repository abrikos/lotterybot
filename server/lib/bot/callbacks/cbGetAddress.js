const t = require("server/i18n");
export default {
    level: 0,
    parent:'cbCabinet',
    drawMenu: true,
    getLabel:()=> t("My current referral address"),
    getMessage: async (user) => {
        return t('Your referral deductions will be sent to') +  `\n*${user.paymentAddress}*`;
    }
}