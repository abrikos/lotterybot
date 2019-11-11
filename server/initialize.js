import {Configurator} from "server/lib/Configurator";
const mongoose = require('server/lib/mongoose');
async function init() {
    //await mongoose.Wallet.deleteMany({});
    //await mongoose.Lottery.deleteMany({});
    //await mongoose.Transaction.deleteMany({});
    //await mongoose.Payment.deleteMany({});
    for (const network of Configurator.getKeys()) {
        const App = new Configurator(network);
        const l = await mongoose.Lottery.findOne({finisTime: 0, network});
        //if (!l) await App.lotteryCreate();

        const users = await mongoose.User.find().populate('wallets')

        for (const user of users) {
            if (!user.getWallet(network)) {
                await App.createWallet(user)
            }
        }
    }
    mongoose.connection.close()
}

init()