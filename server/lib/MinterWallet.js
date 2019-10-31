import moment from "moment";

const {Minter, SendTxParams, MultisendTxParams, prepareSignedTx} = require("minter-js-sdk");
const axios = require("axios");
const logger = require('logat');
const minterWallet = require('minterjs-wallet');
require('dotenv').config()
const config = require("server/config");
const to = require('./to');

export default {
    coin: null,
    init: (coin) => {
        this.coin = coin;
        return this
    },
    multiSendCommission: async (list, mnemonic, message) => {
        const txSigned = await this.getTxSigned(this.multiSendTxList(list), mnemonic, message);
        const minterSDK = new Minter({apiType: 'node', baseURL: config.coins[this.coin].apiUrl});
        return await minterSDK.estimateTxCommission({transaction: txSigned.serialize().toString('hex')}) / 1000000000000000000;
    },

    multiSendTxList: (list) => {
        for (const l of list) {
            l.coin = this.coin;
        }
        return {list};
    },

    multiSendTx: async function (list, mnemonic, message) {
        return await this.postTx(this.multiSendTxList(list), mnemonic, message);
    },

    send: async function (address, mnemonic, amount, message) {
        const txProto = {
            address,
            coinSymbol:
            amount,
        };
        return await this.postTx(txProto, mnemonic, message);
    },

    getTxSigned: async (txProto, mnemonic, message) => {
        const wallet = minterWallet.walletFromMnemonic(mnemonic);
        const minterSDK = new Minter({apiType: 'node', baseURL: config.coins[this.coin].apiUrl});
        const [error, nonce] = await to(minterSDK.getNonce(wallet.getAddressString()));
        txProto.nonce = nonce;
        txProto.privateKey = wallet.getPrivateKey();
        txProto.chainId = config.coins[this.coin].chainId;
        txProto.gasPrice = 1;
        txProto.message = message;
        txProto.feeCoinSymbol = config.coins[this.coin].symbol;

        if (error) {
            logger.error(error);
            return {error}
        }
        const isMultisend = !!txProto.list;
        const txParams = isMultisend ? new MultisendTxParams(txProto) : new SendTxParams(txProto);
        return prepareSignedTx(txParams);
    },

    postTx: async (txProto, mnemonic, message) => {
        const isMultisend = !!txProto.list;
        const txSigned = await this.getTxSigned(txProto, mnemonic, message);
        const minterSDK = new Minter({apiType: 'node', baseURL: config.coins[this.coin].apiUrl});
        //logger.info(txProto.list)
        try {
            const commission = await minterSDK.estimateTxCommission({transaction: txSigned.serialize().toString('hex')}) / 1000000000000000000;
            if (isMultisend) {
                for (const l of txProto.list) {
                    l.value -= commission / txProto.list.length;
                }
            } else {
                txProto.amount -= commission
            }
            const txParamsComission = isMultisend ? new MultisendTxParams(txProto) : new SendTxParams(txProto);
            const hash = await minterSDK.postTx(txParamsComission);
            return {hash}

        } catch (error) {
            //console.log(error)
            if (!error.response) {
                return {error};
            }
            if (error.response.data.error && error.response.data.error.tx_result && error.response.data.error.tx_result.code === 107) return {error: 107, ...error.response.data.error.tx_result};
            return {error: error.response.data}
        }
    },

    getBalance: async (address) => {
        if (!config.coins[this.coin]) {
            return 0;
        }
        const [error, res] = await to(axios(`${config.coins[this.coin].apiUrl}/address?address=${address}`));
        if (error) {
            logger.error(error);
            return error;
        }
        return parseFloat(res.data.result.balance[config.coins[this.coin].symbol]) / 1000000000000000000;
    },


    sendAll: async function (to, mnemonic, message) {
        const wallet = minterWallet.walletFromMnemonic(mnemonic);
        const balance = await this.getBalance(wallet.getAddressString());
        return await this.send(to, mnemonic, balance, message)
    },

    sendAllToMain: async function (mnemonic) {
        return await this.sendAll(this.mainAddress(), mnemonic)
    },

    sendFromMain: async function (to, amount, message) {
        return await this.send(to, process.env.MAIN_SEED, amount, message)
    },

    mainAddress: function () {
        const wallet = minterWallet.walletFromMnemonic(process.env.MAIN_SEED);
        return wallet.getAddressString();
    },

    loadTransactions: async function (address) {
        //this.transactions = await this.getTransactionsList().catch(e => console.log(e));
        if (!this.checkAddress(address)) return [];
        const list = await this.get(`/addresses/${address}/transactions`);
        if (list.error) return [];
        return this.adaptTransactions(list);
    },

    adaptTx: (tx) => {
        tx.coin = this.coin;
        const message = this.decode(tx.payload);
        try {
            tx.message = JSON.parse(message);
        } catch (e) {
            tx.message = message;
        }

        tx.date = moment(tx.timestamp);
        if (tx.type !== 1) tx.error = 'WRONG TX TYPE';
        tx.value = tx.data.value * 1;
        tx.to = tx.data.to;
        if (tx.data.coin !== this.coin) {
            tx.error = 'WRONG COIN';
        }


        /*if ([1, 13].indexOf(tx.type) === -1) {
            tx.error = 'WRONG TX TYPE';
        } else if (tx.data.list) {
            const list = tx.data.list.filter(l => l.coin === config.coins[coin].symbol)
            if (!list.length) {
                tx.error = 'NO LIST';
            }
            tx.data.list = list;
        } else if (tx.data.coin !== config.coins[coin].symbol) {
            tx.error = 'WRONG COIN';
        }*/
        return tx;
    },

    adaptTransactions: function (txs) {
        return txs.map(tx => this.adaptTx(tx)).filter(tx => tx && tx.message !== 'this is a gift')
    },

    mainTransactionsAll: async function () {
        return await this.loadTransactions(this.mainAddress());
    },

    mainTransactionsIn: async function () {
        const transactions = await this.mainTransactionsAll();
        const mainAddress = this.mainAddress();
        return transactions.filter(tx => tx.from !== mainAddress)
    },

    mainTransactionsOut: async function () {
        const transactions = await this.mainTransactionsAll();
        const mainAddress = this.mainAddress();
        return transactions.filter(tx => tx.from === mainAddress)
    },

    get: async (action) => {
        try {
            const res = await axios(`${config.coins[this.coin].explorerApiUrl}${action}`);
            return res.data.data
        } catch (e) {
            if (!e.response) {
                return {error: e.message};
            }
            return {error: e.response.status, url: `${config.coins[this.coin].explorerApiUrl}${action}`}
        }
    },
    getNetworkConfig: () => {
        return config.coins[this.coin];
    },

    getAddressLink: address => config.coins[this.coin].explorerUrl + '/address/' + address,
    getTransactionLink: hash => config.coins[this.coin].explorerUrl + '/transaction/' + hash,


    checkAddress: function (address) {
        return address.match(/^Mx[a-fA-F0-9]{40}$/)
    },
    decode(value) {
        if (!value) return '';
        return Buffer.from(value, 'base64').toString('ascii')
    }


};

