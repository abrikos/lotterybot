const t = require("../../i18n");
export default {
    level: 0,
    parent:'cbCabinet',
    drawMenu: false,
    getLabel: () => t("👛 Change address"),
    getMessage: user => {
        user.changeAddress = true;
        user.save();
        return t('Enter Your address for payments');
    },
    getSuccessMessage: () => {
        return t('Address changed');
    },
    getWrongMessage: () => {
        return t('Wrong address') + '\n' + t('Enter Your address for payments')
    }

}