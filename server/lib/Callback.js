import * as Callbacks from 'server/lib/callbacks';


export default {
    parseData(data) {
        const findModule = data.split('@');
        const module = findModule[0];
        const findAction = findModule[1].split('#');
        const action = findAction[0];
        const params = findAction[1];
        return {module, action, params}
    },

    async process(data, user) {
        const {module, action, params} = this.parseData(data);
        const response = await Callbacks[module].process({action, params, user});
        const inline_keyboard = response.menu;
        /*response.menu = {
            parse_mode: "Markdown",
            reply_markup: {
                //keyboard: config.languageMenu,
                inline_keyboard: response.menu,
                //one_time_keyboard: false,
                //resize_keyboard: true,
            },
        };*/
        response.menu = response.noMarkdown ? {} : {parse_mode: "Markdown"};
        if (inline_keyboard && inline_keyboard.length) {
            response.menu.reply_markup = {inline_keyboard};
        }
        return response;

    }
}