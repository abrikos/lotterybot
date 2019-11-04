import config from 'server/config';
import MinterWallet from "server/lib/networks/Minter";
import Ethereum from "server/lib/networks/Ethereum";

const logger = require('logat');

/*
const pk = '0x25C8E249904F8D1999F84855124E658544EBE4646B6D38C3FFA3C407450E578B';
const crypto = Ethereum.init(config.networks.find(n => n.key === 'kovan'));
crypto.postTx('0xAfa7FaF188E0FD929208bcE9b4A7DE4912a61677',pk, 0.001,'tezzt').then(console.log).catch(console.error);
*/

/*
const pk = 'twist gun cabin arrange menu athlete goat ramp excite same scatter reduce';
const crypto = MinterWallet.init(config.networks.find(n => n.key === 'minter-mnt'));
crypto.send('Mx389a3ec7916a7c40928ab89248524f67a834eab7', 'MNT',pk, 1,'tezzt').then(console.log).catch(console.error);
*/
export default {}

export class Configurator {
    static getNetworks() {
        return config.networks.filter(n => n.enabled);
    }

    static getConfig() {
        return config;
    }

    static getKeys() {
        return config.networks.filter(n => n.enabled).map(n => n.key);
    }

    constructor(key) {
        this.config = config;
        this.networks = config.networks.filter(n => n.enabled);

        this.network = this.networks.find(n => n.key === key)
        switch (this.network.key) {
            case 'minter-bip':
            case 'minter-mnt':
                this.crypto = MinterWallet.init(this.network);
                break;
            case 'eth':
            case 'ropsten':
            case 'rinkeby':
            case 'kovan':
                this.crypto = Ethereum.init(this.network);
                break;
            default:
                logger.error('NO network key', this.network.key)
        }
    }

    getNetsKeys() {
        return this.networks.map(n => n.key)
    }

    getNetwork() {
        return this.network
    }

    getStopSum(fixed) {
        const sum = this.getNetwork().prize / this.config.lotteryPercent;
        return fixed ? sum.toFixed(this.getNetwork().toFixed * 1) : sum
    }

    getPrize() {
        return this.getNetwork().prize;
    }

    getOwnerAddress() {
        return this.getNetwork().ownerAddress;
    }

    getCoin() {
        return this.getNetwork().coin;
    }

    static getGroupId() {
        return config.groupId;
    }

    static getGroupName() {
        return config.groupName;
    }

    static getBotName() {
        return config.botName;
    }
}