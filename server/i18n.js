const i18n = require("i18n");
i18n.configure({
    locales:['en', 'ru'],
    directory: __dirname + '/../public/locales'
});
module.exports =  function t(text){
    return i18n.__(text);
};
