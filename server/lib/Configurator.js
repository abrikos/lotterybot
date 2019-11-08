import config from 'server/config';
import MinterWallet from "server/lib/networks/Minter";
import Ethereum from "server/lib/networks/Ethereum";

const t = require("server/i18n");
const logger = require('logat');
const mongoose = require('./mongoose');

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

    async lotteryFinish(lottery) {
        if (lottery.finishTime) return;
        if (lottery.balance < this.getStopSum()) return;

        const players = [];
        for (const tx of lottery.transactionsFromUser) {
            for (let i = 0; i < Math.ceil(tx.value); i++) {
                players.push(tx);
            }
        }
        lottery.winner = players[Math.floor(Math.random() * players.length)];
        logger.info('WINNER', lottery.winner.from)
        const argsWinner = {
            to: lottery.winner.from,
            from: lottery.wallet.address,
            amount: this.getPrize(),
            lottery: lottery,
            type: 'winner',
            starterTx: lottery.winner.hash,
            message: {msg: this.config.appName + '. Winner', starterTx: lottery.winner.hash},
            coin: lottery.coin
        };
        mongoose.Payment.create(argsWinner);

        const address = this.getNetwork().ownerAddress;

        //Reduce by commission of winner transaction
        const commission = await this.crypto.getCommission({address, pk: lottery.wallet.seed, amount: argsWinner.amount, message: argsWinner.message});
        let amount = lottery.balance - this.getPrize() - commission;
        const argsOwner = {
            to: address,
            from: lottery.wallet.address,
            amount,
            lottery: lottery,
            type: 'owner',
            starterTx: lottery.winner.hash,
            coin: lottery.coin
        };
        mongoose.Payment.create(argsOwner);
        lottery.finishTime = new Date().valueOf();
        await lottery.save();
        await this.lotteryCreate();

    }

    async lotteryCreate() {
        const wallet = await this.createWallet();
        return await mongoose.Lottery.create({finishTime: 0, wallet, network: wallet.network, coin: this.getCoin()});
    }

    async lotteryCurrent() {
        let lottery = await mongoose.Lottery.findOne({finishTime: 0, network: this.network.key})
            .populate(mongoose.Lottery.population);
        if (!lottery) {
            lottery = await this.lotteryCreate();
        }
        return lottery;
    }

    payReferralParent(transaction) {
        if (transaction.payments.find(p => p.type === 'referral')) return true;
        const address = transaction.referralAddress;
        if (!address) return true;
        const App = new Configurator(transaction.network);

        const referral = transaction.value * App.getNetwork().referralPercent;
        const args = {
            to: address,
            from: transaction.walletTo.address,
            amount: referral,
            message: App.config.appName + '. Referral payment',
            lottery: transaction.lottery,
            starterTx: transaction.hash,
            type: 'referral',
            coin: this.getCoin()
        }
        try {
            mongoose.Payment.create(args);
            return true;
        } catch (e) {
            logger.error(e);
            return false;
        }


    };

    moveToLottery(transaction) {
        if (!transaction.walletTo || transaction.walletFrom) return true;
        if (transaction.payments.find(p => p.type === 'lottery')) return true;
        const App = new Configurator(transaction.network);
        let referral = 0;
        if (transaction.referralAddress) {
            referral = transaction.value * App.getNetwork().referralPercent;
        }
        const args = {
            to: transaction.lottery.wallet.address,
            from: transaction.walletTo.address,
            amount: transaction.value - referral,
            lottery: transaction.lottery,
            starterTx: transaction.hash,
            type: 'lottery',
            message: {starterTx: transaction.hash},
            coin: this.getCoin()
        };
        try {
            mongoose.Payment.create(args);
            return true;
        } catch (e) {
            logger.error(e);
            return false;
        }
    };

    async paymentExecute(payment) {

        const noCommission = payment.type === 'winner';
        let amount = payment.amount;
        const args = {
            address: payment.to,
            pk: payment.walletFrom.seed,
            amount,
            message: payment.message,
            noCommission
        };
        logger.info('TRY EXECUTE PAYMENT', args)
        const tx = await this.crypto.send(args);
        if (tx.error) {
            if(tx.code !== 'Insufficient funds') logger.error("Can't execute payment", args, tx);
        }else{
            payment.payedTx = tx.hash;
            await payment.save();
        }
        return tx;
    };


    async getUser(from) {
        let user = await mongoose.User.findOne({id: from.id})
            .populate(mongoose.User.population);
        if (!user) {
            user = new mongoose.User(from);
            await user.save();
            for (const network of this.networks.map(n => n.key)) {
                await this.createWallet(user);
            }
        }
        user = await user.populate(mongoose.User.population).execPopulate();
        return user;
    };

    async createWallet(user) {
        const wallet = new mongoose.Wallet(await this.crypto.generateWallet());
        wallet.network = this.network.key;
        wallet.user = user;
        wallet.coin = this.getCoin();
        await wallet.save();
        //logger.info('Wallet created', network)
        return wallet;
    };

    setReferralAddress(user, address) {
        const network = this.getNetwork();
        if (!network) return {error: 'WRONG NETWORK:' + user.waitForReferralAddress};
        const regexp = new RegExp(network.walletAddressRegexp);
        if (!address.match(regexp)) return {error: 'Wrong address', network}
        const found = this.addresses.find(a => a.network === network.key)
        if (found) {
            found.address = address;
        } else {
            user.addresses.push({address, network: network.key})
        }
        user.waitForReferralAddress = null;
        user.save();
    };


    lotteryInfo(lottery) {
        return t('Crypto currency') + `: *${this.getNetwork().name}*`
            + '\n' + t('Referral program') + `: *${this.getNetwork().referralPercent * 100}%*`
            + '\n' + t('Lottery starts') + `: *${lottery.date}*`
            + '\n' + t('The lottery will end when the balance of it wallet reaches') + `: *${this.getStopSum(true)}* ${lottery.coin}`
            + '\n' + t('Current lottery balance') + `: *${lottery.balance.toFixed(2)}* ${lottery.coin}`
            + '\n' + t('Lottery wallet') + `: ${this.crypto.getAddressLink(lottery.wallet.address)}`
            + '\n' + t('Percent completion') + `: *${(lottery.balance / this.getStopSum() * 100).toFixed(2)}%*`
    };


}