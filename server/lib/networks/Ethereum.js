import moment from "moment";

const API = require('etherscan-api');
const Web3 = require('web3');
const util = require('ethereumjs-util');
const Tx = require('ethereumjs-tx').Transaction;
const ecies = require("eth-ecies");

const axios = require("axios");
const logger = require('logat');
const promiser = require('server/lib/to');



export default {
    network: null,
    test:'zzzzzzzzzz',
    init(network) {
        this.network = network;
        //this.api = API.init('YourApiKey','rinkeby', '3000')
        this.api = new Web3(new Web3.providers.HttpProvider(`https://${this.network.api}.infura.io/`));
        //this.api = new EthereumWallet(`https://${this.network.api}.infura.io/`);
        return this
    },

    async generateWallet() {
        const account = this.api.eth.accounts.create();
        const wallet = {};
        wallet.seed = account.privateKey;
        wallet.address = account.address;
        return wallet;
    },


    async getBalance(address) {
        return this.api.utils.fromWei(await this.api.eth.getBalance(address));
    },


    adaptTx(tx) {
        tx.coin = this.network.coin;
        const message = this.decode(tx.payload);
        try {
            tx.message = JSON.parse(message);
        } catch (e) {
            tx.message = message;
        }

        tx.date = moment(tx.timestamp);
        tx.value = tx.data.value * 1;
        tx.to = tx.data.to;
        if (tx.data.coin !== this.network.coin) {
            tx.error = 'WRONG COIN';
        }
        return tx;
    },

    async multiSendTx(list, pk, message) {
        const txs = [];
        for (const item of list) {
            const tx = await this.postTx(item.to, pk, item.value, message)
            txs.push(tx);
        }
        return txs[0];
    },

    async postTx(to, pk, value, message) {
        const block = await this.api.eth.getBlock("latest");
        const gasLimit = this.api.utils.toHex(block.gasLimit);
        const gas = await this.api.eth.estimateGas({to, "data": this.encrypt(message)});
        const account = await this.api.eth.accounts.privateKeyToAccount(pk)
        let nonce = await this.api.eth.getTransactionCount(account.address)
        nonce = nonce + 1;
        const gasPrice = this.api.utils.toHex(gas*10000);
        const privateKey = Buffer.from(pk.substring(2), 'hex');
        const rawTx = {
            nonce,
            gasPrice,
            gasLimit,
            to,
            value,
            //data: this.encrypt(message)
        };
        logger.info(rawTx, gas)
        const tx = new Tx(rawTx, {'chain': this.network.api});
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        //const [error, hash] = await promiser(this.api.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log))
        this.api.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('receipt', console.log)
            //.on('transactionHash', console.log)
            .on('confirmation', console.log)
            .on('error', console.log)
        return;


        if (!error) {
            logger.info('ZZZZZZZZZZZZZZZZZZZZZZ',hash)
            return {hash}
        } else {
            //logger.error(error)
            return {error}
        }


    },

    encrypt(publicKey, data) {
        if (!data) return '0x00';
        let userPublicKey = new Buffer(publicKey, 'hex');
        let bufferData = new Buffer(data);

        let encryptedData = ecies.encrypt(userPublicKey, bufferData);

        return encryptedData.toString('base64')
    },

    getAddressLink(address) {
        return this.network.explorerUrl + '/address/' + address
    },
    getTransactionLink(hash) {
        return this.network.explorerUrl + '/transaction/' + hash
    },


    checkAddress(address) {
        const re = new RegExp(this.network.walletAddressRegexp);
        return address.match(re)
    },
    decode(value) {
        if (!value) return '';
        return Buffer.from(value, 'base64').toString('ascii')
    }


};

