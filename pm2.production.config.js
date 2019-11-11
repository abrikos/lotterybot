const pkginfo = require('./package.json');
const execSync = require('child_process').execSync;

const log_date_format = 'DD.MM.YYYY HH:mm:ss';
const combine_logs = true;

let branch = '';

try {
    let gitInfo = execSync('git log -1 --date="format:%Y.%m.%d:%H%M" --format="%cd %D"') + '';
    branch = gitInfo.split(',')[1].split('/').pop();
} catch (error) {
}
;

/**
 * Конфигурация для деплоя
 */
module.exports = {
    apps: [{
        name: `${pkginfo.name}-bot`,
        script: `${__dirname}/server/bot.js`,
        node_args: '--preserve-symlinks -r esm',
        env: {
            NODE_ENV: 'production',
            SOURCE_MAP: 'source-map',
            NODE_PATH: '.',
            //DEBUG: '*',
        },
        output: 'logs/bot.log',
        error: 'logs/bot-error.log',
        //log_date_format,
        //combine_logs,
        //error_file: `${__dirname}/logs/server.err.log`,
        //out_file:   `${__dirname}/logs/server.out.log`,
        //pid_file:   `${__dirname}/logs/server.pid`,
    },{
        name: `${pkginfo.name}-server`,
        script: `${__dirname}/server/server.js`,
        node_args: '--preserve-symlinks -r esm',
        env: {
            NODE_ENV: 'production',
            SOURCE_MAP: 'source-map',
            NODE_PATH: '.',
            //DEBUG: '*',
        },
        output: 'logs/server.log',
        error: 'logs/server-error.log',
        //log_date_format,
        //combine_logs,
        //error_file: `${__dirname}/logs/server.err.log`,
        //out_file:   `${__dirname}/logs/server.out.log`,
        //pid_file:   `${__dirname}/logs/server.pid`,
    }]
};
