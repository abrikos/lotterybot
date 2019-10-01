const t = require("../../i18n");
export default {
    level: 1,
    parent:'cbCabinet',
    drawMenu: false,
    getLabel: () => t("My referral link"),
    getMessage: user => {
        return t('Your referral link') + '\n' + user.referralLink;
    }
}