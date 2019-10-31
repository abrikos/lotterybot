import BotProcess from 'server/lib/bot/bot-process';
import CronProcess from 'server/lib/cron-process';
const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');
require('dotenv').config()

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true,
    request: {
        agentClass: Agent,
        agentOptions: {
            socksHost: process.env.PROXY_SOCKS5_HOST,
            socksPort: parseInt(process.env.PROXY_SOCKS5_PORT),
            // If authorization is needed:
            // socksUsername: process.env.PROXY_SOCKS5_USERNAME,
            // socksPassword: process.env.PROXY_SOCKS5_PASSWORD
        }
    }
});
BotProcess.init(bot);
CronProcess.init(bot);
