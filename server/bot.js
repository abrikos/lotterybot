import BotProcess from 'server/lib/bot-process';
import CronProcess from 'server/lib/cron-process';
const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');
require('dotenv').config()

const options = {
    polling: true,
    request: {
        agentClass: Agent,
        agentOptions: {
            // If authorization is needed:
            // socksUsername: process.env.PROXY_SOCKS5_USERNAME,
            // socksPassword: process.env.PROXY_SOCKS5_PASSWORD
        }
    }
};
if(process.env.PROXY_SOCKS5_HOST && parseInt(process.env.PROXY_SOCKS5_PORT)){
    options.request.agentOptions.socksHost = process.env.PROXY_SOCKS5_HOST
    options.request.agentOptions.socksPort = parseInt(process.env.PROXY_SOCKS5_PORT)
}
const bot = new TelegramBot(process.env.BOT_TOKEN, options);
BotProcess.run(bot);
CronProcess.run(bot);
