const t = require("../../i18n");
export default {
    level: 0,
    parent:'cbCabinet',
    drawMenu: false,
    getLabel: () => t("Change referral address"),
    getMessage: user => {
        user.changeAddress = true;
        user.save();
        return t('Please enter your address for payments');
    },
    getSuccessMessage: () => {
        return t('Address changed');
    },
    getWrongMessage: () => {
        return t('Wrong address')
    }

}