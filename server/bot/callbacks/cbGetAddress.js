const t = require("../../i18n");
export default {
    level: 2,
    drawMenu: true,
    getLabel:()=> t("My address"),
    getMessage: async (user) => {
        return t('Your winnings and referral deductions will be sent to') +  `\n*${user.wallet}*`;
    }
}