import Configurator from "server/lib/Configurator";
const t = require("server/i18n");
export default {
    async process(args) {
        return await this[args.action]();
    },

}

