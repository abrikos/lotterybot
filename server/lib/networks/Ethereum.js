const axios = require("axios");
const logger = require('logat');
const ethers = require('ethers')
const promise = require('server/lib/to')

export default {
    network: null,

    init(network) {
        this.network = network;
        this.explorerApiUrl = `https://api${this.network.api ? '-' + this.network.api : ''}.etherscan.io/api?module=`;
        this.explorerUrl = `https://${this.network.api}.etherscan.io`;
        //this.api = API.init('YourApiKey','rinkeby', '3000')
        //this.api = new Web3(new Web3.providers.HttpProvider(`https://${this.network.api}.infura.io/`));
        //this.api = new EthereumWallet(`https://${this.network.api}.infura.io/`);
        this.provider = ethers.getDefaultProvider(this.network.api);
        return this
    },

    async generateWallet() {
        const w = ethers.Wallet.createRandom();
        const wallet = {};
        wallet.seed = w.privateKey;
        wallet.address = w.address.toLowerCase();
        return wallet;
    },


    async getBalance(address) {
        const res = await this.getExplorer('account&action=balance&address='+address)
        return res.result * 1;
    },


    adaptTx(tx) {
        tx.network = this.network.key;
        tx.coin = this.network.coin;
        const message = this.decode(tx.input);
        try {
            tx.message = JSON.parse(message);
        } catch (e) {
            tx.message = message;
        }
        tx.timestamp = tx.timeStamp;
        tx.from = tx.from.toLowerCase();
        tx.to = tx.to.toLowerCase();
        tx.value = ethers.utils.formatEther(tx.value);
        return tx;
    },

    async getCommission() {
        return ethers.utils.formatEther( await this.commission());
    },

    async commission(){
        const gasPrice = await this.provider.getGasPrice();
        const gasLimit = 21000;
        return  gasPrice.mul(gasLimit).mul(2);//.add(ethers.utils.parseEther('0.000002'));
    },

    async send({address, pk, amount, message, noCommission}) {
        const wallet = new ethers.Wallet(pk, this.provider);
        const balance = await wallet.getBalance();

        const commission = await this.commission();
        let value =  ethers.utils.parseEther(amount.toFixed(17).toString());
        if(balance.lt(value)) value = balance;
        const tx = {
            to: address,
            value: noCommission ? value : value.sub(commission),
            data: this.encode(message)
        };
        const [error,res] = await promise(wallet.sendTransaction(tx));
        if(error){
            error.from =  wallet.address;
            error.to =  address;
            error.amount =  amount;
            error.value = ethers.utils.formatEther(tx.value.toString());
            error.commission =  ethers.utils.formatEther(commission);
            return error;
        }
        return res;

    },

    adaptTransactions(txs) {
        if (typeof txs !== 'object') return [];
        return txs.map(tx => this.adaptTx(tx)).filter(tx => tx && !tx.error && tx.message !== 'this is a gift')
    },


    async loadTransactions(address) {
        //this.transactions = await this.getTransactionsList().catch(e  console.log(e));
        if (!this.checkAddress(address)) return [];
        const res = await this.getExplorer(`account&action=txlist&address=${address}`);
        if (res.message !== "OK") return [];
        return this.adaptTransactions(res.result);
    },

    async getExplorer(action) {
        return await this.get(this.explorerApiUrl, action);
    },

    async get(url, action) {
        //logger.info(`${url}${action}`)
        try {
            const res = await axios(`${url}${action}`);
            return res.data;

        } catch (error) {
            if (error.response)
                return {error: error.response.status, data: error.response.data};
            else
                return {error: 'Server not response', data: 'Can not connect to server'}
        }
    },



    getAddressLink(address) {
        return this.explorerUrl + '/address/' + address
    },
    getTransactionLink(hash) {
        return this.explorerUrl + '/tx/' + hash
    },


    checkAddress(address) {
        const re = new RegExp(this.network.walletAddressRegexp);
        return address.match(re)
    },

    encode(message) {
        const utf8 = ethers.utils.toUtf8Bytes(JSON.stringify(message) || '');
        return ethers.utils.hexlify(utf8)
    },

    decode(value) {
        if (!value) return '';
        return ethers.utils.toUtf8String(ethers.utils.hexlify(value))

    }


};

