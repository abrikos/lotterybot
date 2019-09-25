const t = require("../../i18n");
export default {
    level: 1,
    drawMenu: true,
    getLabel:()=> t("Cabinet"),
    getMessage: async (user) => {
        return t('Cabinet');
    }
}