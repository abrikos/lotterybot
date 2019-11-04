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

    async multiSendTx(list, mnemonic, message) {
        return await this.postTx(this.multiSendTxList(list), mnemonic, message);
    },

    async send(address, coinSymbol, mnemonic, amount, message) {
        const txProto = {
            address,
            coinSymbol,
            amount,
        };
        return await this.postTx(txProto, mnemonic, message);
    },

    async getTxSigned(txProto, mnemonic, message) {
        const wallet = minter.walletFromMnemonic(mnemonic);
        const minterSDK = new Minter({apiType: 'node', baseURL: this.network.apiUrl});
        const [error, nonce] = await to(minterSDK.getNonce(wallet.getAddressString()));
        txProto.nonce = nonce;
        txProto.privateKey = wallet.getPrivateKey();
        txProto.chainId = this.network.chainId;
        txProto.gasPrice = 1;
        txProto.message = message;
        txProto.feeCoinSymbol = this.network.coin;

        if (error) {
            logger.error(error);
            return {error}
        }
        const isMultisend = !!txProto.list;
        const txParams = isMultisend ? new MultisendTxParams(txProto) : new SendTxParams(txProto);
        return prepareSignedTx(txParams);
    },

    async postTx(txProto, mnemonic, message) {
        const isMultisend = !!txProto.list;
        const txSigned = await this.getTxSigned(txProto, mnemonic, message);
        const minterSDK = new Minter({chainId: this.network.chainId, apiType: 'gate', baseURL: 'https://gate.minter.network/api/v1/'});
        //logger.info(txProto.list)
        try {
            const commission = await minterSDK.estimateTxCommission({transaction: txSigned.serialize().toString('hex')}) / 1000000000000000000 * 1.1;

            if (isMultisend) {
                for (const l of txProto.list.filter(l=>!l.noCommission)) {
                    l.value -= commission / txProto.list.filter(l=>!l.noCommission).length;
                }
            } else {
                txProto.amount -= commission
            }
            console.log('Commisiion', commission, txProto.list)
            const txParamsCommission = isMultisend ? new MultisendTxParams(txProto) : new SendTxParams(txProto);
            const hash = await minterSDK.postTx(txParamsCommission);
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
        const list = await this.get(`/addresses/${address}/transactions`);
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
        } else if(tx.data.list && tx.data.list.length === 1){
            tx.to = tx.data.list[0].to;
            tx.coin = tx.data.list[0].coin;
            tx.value = tx.data.list[0].value;
        } else if(tx.data.list && tx.data.list.length === 2){
            tx.to = tx.data.list[1].to;
            tx.coin = tx.data.list[1].coin;
            tx.value = tx.data.list[1].value;
        }else{
            tx.error ='UNSUPPORTED MULTISEND'
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
        return txs.map(tx => this.adaptTx(tx)).filter(tx => tx && !tx.error && tx.message !== 'this is a gift')
    },

    async getTransaction(hash) {
        const tx = await this.get('/transactions/' + hash);
        console.log(tx)
        return this.adaptTx(tx);
    },

    async get(action) {
        try {
            const res = await axios(`${this.network.explorerApiUrl}${action}`);
            return res.data.data
        } catch (e) {
            if (!e.response) {
                return {error: e.message};
            }
            return {error: e.response.status, url: `${this.network.explorerApiUrl}${action}`}
        }
    },

    getAddressLink(address) {
        return this.network.explorerUrl + '/address/' + address
    },
    getTransactionLink(hash) {
        return this.network.explorerUrl + '/transaction/' + hash
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

