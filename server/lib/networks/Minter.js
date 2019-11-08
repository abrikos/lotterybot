import moment from "moment";

const {Minter, SendTxParams, MultisendTxParams, prepareSignedTx} = require("minter-js-sdk");
const axios = require("axios");
const logger = require('logat');
const minter = require('minterjs-wallet');
require('dotenv').config()
const to = require('server/lib/to');

export default {
    network: null,

    init(network) {
        this.network = network;
        this.sdk = new Minter({chainId: this.network.chainId, apiType: 'node', baseURL: this.network.apiUrl});
        return this
    },

    async multiSendCommission(list, mnemonic, message) {
        const txSigned = await this.getTxSigned(this.multiSendTxList(list), mnemonic, message);
        const minterSDK = new Minter({apiType: 'node', baseURL: this.network.apiUrl});
        return await minterSDK.estimateTxCommission({transaction: txSigned.serialize().toString('hex')}) / 1000000000000000000;
    },

    multiSendTxList(list) {
        for (const l of list) {
            l.coin = this.network.coin;
        }
        return {list};
    },

    async multiSendTx({list, mnemonic, message}) {
        return await this.postTx(this.multiSendTxList(list), mnemonic, message);
    },


    async getCommission(args) {
        const txProto = await this.getTxProto(args)
        const txSigned = this.getTxSigned(txProto);
        const res = await this.getApi('estimate_tx_commission?tx=0x' + txSigned.serialize().toString('hex'));
        return res.result.commission / 1000000000000000000 * 1.1
    },

    async getNonce(address) {
        const response = await this.get(this.network.apiUrl, `address?address=${address}`);
        return response.result.transaction_count * 1 + 1;
    },

    async getTxProto({address, pk, amount, message}) {
        const wallet = minter.walletFromMnemonic(pk);
        return {
            privateKey: wallet.getPrivateKeyString(),
            nonce: await this.getNonce(wallet.getAddressString()),
            chainId: this.network.chainId,
            address,
            amount,
            coinSymbol: this.network.coin,
            feeCoinSymbol: this.network.coin,
            gasPrice: 1,
            message: typeof message === 'object' ? JSON.stringify(message) : message,
        }
    },

    getTxSigned(txProto) {
        const txParams = new SendTxParams(txProto);
        return prepareSignedTx(txParams);
    },

    async send({address, pk, amount, message, noCommission}) {
        const args = {address, pk, amount, message, noCommission};

        const commission = await this.getCommission(args);
        const txProto = await this.getTxProto(args)
        if (!args.noCommission) {
            txProto.amount -= commission
        }
        /*const txParams = new SendTxParams(txProto);
        const res =  await this.sdk.postTx(txParams);
        logger.info(res)*/

        const txSigned = this.getTxSigned(txProto);
        const res = await this.getApi('send_transaction?tx=0x' + txSigned.serialize().toString('hex'));
        if (res.error) {
            let code;
            if (res.data.error.tx_result && res.data.error.tx_result.code === 107) code = 'Insufficient funds';
            return {error: res.data, code};
        }
        return {hash: 'Mt' + res.result.hash};

    },

    async getBalance(address) {
        const [error, res] = await to(axios(`${this.network.apiUrl}/address?address=${address}`));
        if (error) {
            logger.error(error);
            return error;
        }
        return parseFloat(res.data.result.balance[this.network.coin]) / 1000000000000000000;
    },

    async loadTransactions(address) {
        //this.transactions = await this.getTransactionsList().catch(e  console.log(e));
        if (!this.checkAddress(address)) return [];
        const list = await this.getExplorer(`/addresses/${address}/transactions`);
        if (list.error) return [];
        return this.adaptTransactions(list);
    },

    adaptTx(tx) {

        tx.network = this.network.key;
        const message = this.decode(tx.payload);
        try {
            tx.message = JSON.parse(message);
        } catch (e) {
            tx.message = message;
        }

        tx.timestamp = moment(tx.timestamp).valueOf();

        if (tx.data.to) {
            tx.to = tx.data.to;
            tx.coin = tx.data.coin;
            tx.value = tx.data.value * 1;
        } else if (tx.data.list && tx.data.list.length === 1) {
            tx.to = tx.data.list[0].to;
            tx.coin = tx.data.list[0].coin;
            tx.value = tx.data.list[0].value;
        } else if (tx.data.list && tx.data.list.length === 2) {
            tx.to = tx.data.list[1].to;
            tx.coin = tx.data.list[1].coin;
            tx.value = tx.data.list[1].value;
        } else {
            tx.error = 'UNSUPPORTED MULTISEND'
        }

        if (tx.coin !== this.network.coin) {
            tx.error = 'WRONG COIN';
        }


        /*if ([1, 13].indexOf(tx.type) === -1) {
            tx.error = 'WRONG TX TYPE';
        } else if (tx.data.list) {
            const list = tx.data.list.filter(l  l.coin === config.coins[coin].symbol)
            if (!list.length) {
                tx.error = 'NO LIST';
            }
            tx.data.list = list;
        } else if (tx.data.coin !== config.coins[coin].symbol) {
            tx.error = 'WRONG COIN';
        }*/
        return tx;
    },

    adaptTransactions(txs) {
        if (typeof txs !== 'object') return [];
        return txs.map(tx => this.adaptTx(tx)).filter(tx => tx && !tx.error && tx.message !== 'this is a gift')
    },

    async getTransaction(hash) {
        const tx = await this.getExplorer('/transactions/' + hash);
        return this.adaptTx(tx);
    },

    async getApi(action) {
        //logger.info(this.network.apiUrl + action)
        return await this.get(this.network.apiUrl, action)
    },

    async getExplorer(action) {
        const res = await this.get(this.network.explorerApiUrl, action)
        return res.data;
    },

    async get(url, action) {
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
        return this.network.explorerUrl + '/address/' + address
    },
    getTransactionLink(hash) {
        return this.network.explorerUrl + '/transactions/' + hash
    },


    checkAddress(address) {
        const re = new RegExp(this.network.walletAddressRegexp);
        return address.match(re);
    },

    async generateWallet() {
        const wt = minter.generateWallet();
        const wallet = {};
        wallet.seed = wt._mnemonic;
        wallet.address = wt.getAddressString();
        return wallet;
    },

    decode(value) {
        if (!value) return '';
        return Buffer.from(value, 'base64').toString('ascii')
    }


};

