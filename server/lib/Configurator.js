import config from 'server/config';
import MinterWallet from "server/lib/networks/Minter";

export default {
    config,
    networks: config.networks.filter(n => n.enabled),
    botName: process.env.BOT_NAME,

    getCryptoProcessor(networkKey) {
        const network = config.networks.find(n => n.key === networkKey);
        switch (networkKey) {
            case 'minter-bip':
            case 'minter-mnt':
                return MinterWallet.init(network).default;
                break;

        }
    },

    getNetsKeys() {
        return this.networks.map(n => n.key)
    },

    getNetwork(networkKey) {
        return this.networks.find(n => n.key === networkKey)
    }
}