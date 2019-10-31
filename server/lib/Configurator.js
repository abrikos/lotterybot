import config from 'server/config';
import MinterWallet from "server/lib/MinterWallet";
export default {
    config,
    botName: process.env.BOT_NAME,
    getCryptoProcessor(coin){
        switch (coin) {
            case 'MNT':
            case 'BIP':
                return MinterWallet.init(coin).default;
                break;

        }
    }
}