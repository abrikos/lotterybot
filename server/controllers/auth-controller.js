const MinterWallet = require("../lib/MinterWallet");

const passportLib = require('../lib/passport');
const passport = require('passport');
const validator = require('validator');
const mongoose = require("../lib/mongoose");
const logger = require('logat');
const moment = require('moment');
const config = require('../../client/lib/config');
const hostConfig = require("../../client/lib/host.config.local")
const to = require('../lib/to');
const mailer = JSON.parse(process.env.mailer);
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({direct: true, host: mailer.host, port: mailer.port, auth: mailer.auth});
const randomWords = require('random-words');

module.exports.controller = function (app) {

    app.post('/api/auth/referral/get', (req, res) => {
        res.send({referral: req.cookies.referral})
    });

    app.post('/api/auth/referral/set/random', passportLib.isLogged, async(req, res) => {
        const [error,items]= await to(mongoose.User.find());
        if(error) return res.send(error);
        const user = await mongoose.User.findById(req.session.passport.user._id);
        if(!user) return res.sendStatus(403);
        user.referralCode = items[Math.floor(Math.random()*items.length)].referralCode;
        await user.save();
        res.send({referral: user.referralCode});
    });

    app.post('/api/auth/referral/check', (req, res) => {
        logger.info(req.body.value)
        mongoose.User.findOne({referralCode: req.body.value})
            .then(user => {
                res.send({codeValid: !!user})
            })
            .catch(err => res.send({error: 500, message: err.message}))
    });


    app.post('/api/status', (req, res) => {
        res.send({ok: 200})
    });

    app.post('/api/loginFail', (req, res) => {
        res.send({error: "Login fail"})
    });

    app.post('/api/logout', (req, res) => {
        req.session.destroy(function (err) {
            res.send({ok: 200})
        });

    });

    app.post('/api/confirmation-code/:code', (req, res, next) => {
        mongoose.EmailConfirm.findOne({code: req.params.code})
            .populate('user')
            .then(code => {
                code.user.emailConfirmed = true;
                code.user.save(error => {
                    if (error) return res.send({error: 500, message: error.message})
                    res.send({ok: 200})
                })
            })
            .catch(error => res.send({error: 500, message: error.message}))
    });

    function sendEmailConfirmation(user, confirmation) {
        /*const text = `Confirm e-mail by click on link: ${hostConfig.url}/confirmation-code/${confirmation.code}`;
        const mailOptions = {from: mailer.from, to: user.username, subject: config.appName + ': Email confirmation', text};

        const [e2,x] = await to(transporter.sendMail(mailOptions))
        if (e2) {
            logger.error(e2)
        }
        logger.info(x)*/
        const options = {
            to: user.username, // REQUIRED. This can be a comma delimited string just like a normal email to field.
            subject: config.appName + ': Email confirmation', // REQUIRED.
            link: `${hostConfig.url}/confirmation-code/${confirmation.code}`
        };
        logger.info(options);
        app.mailer.send('email-confirmation', options, (error, message) => {
            logger.info(error, message)
        })
    }

    app.post('/api/login/re-confirmation', (req, res, next) => {

        passport.authenticate('local', function (err, user, info) {
            if (err) {
                logger.error(err)
                return next(err)
            }
            if (!user) {
                logger.warn(info)
                return next(info)
            }

            if (info.error === 'email-confirm') {

                mongoose.EmailConfirm.findOne({user, date: {$lt: moment().add(-1, 'week')}})
                    .sort({date: -1})
                    .then(existConfirm => {

                        logger.info(existConfirm)
                        if (existConfirm) return res.send({error: 203, message: 'There is awaiting confirmation code. Wait a hour'})
                        logger.info(user)
                        mongoose.EmailConfirm.create({user, code: new Date().valueOf()})
                            .then(confirmation => {
                                    sendEmailConfirmation(user, confirmation);
                                    res.send({})
                                }
                            )
                            .catch(error => res.send({error: 500, message: error.message}))

                    })
                    .catch(error => res.send({error: 500, message: error.message}))


            }
        })(req, res, next);
    });


    app.post('/api/login/local', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user || info.error) {
                return res.send(info);
            }

            req.login(user, (req, res) => {

            });
            res.send({ok: 200})
        })(req, res, next);
    });


    app.post('/api/login/telegram', passport.authenticate('telegram'), (req, res) => {
        res.send({ok: 200})
    });

    app.post('/api/login/google', passport.authenticate('google'), (req, res) => {
        res.send({ok: 200})
        logger.info('GOOGLE DONE')
    });


    app.post('/auth/google/return', passportLib.isLogged, (req, res) => {
        logger.info('POST', req.body)
    });

    app.get('/auth/google/return', passportLib.isLogged, (req, res) => {
        logger.info('GET', req.query)
    });

    app.post('/BAKapi/auth/test', passportLib.isLogged, async (req, res) => {
        const user = req.session.passport.user;
        const [err3, confirmation] = await to(mongoose.EmailConfirm.create({user, code: new Date().valueOf()}));
        if (err3) return res.send(err3);

        sendEmailConfirmation(user, confirmation);
        res.send({ok: 200})

    });


    app.post('/api/isAuth', passportLib.isLogged, async (req, res) => {
        //const [error, user] = await to( mongoose.User.findById(req.session.passport.user.id));
        //if (!MinterWallet.checkAddress(user.address)) return res.send({error: 412, message:"No wallet's address", authenticated: true})
        res.send({authenticated: true})
    });

    app.post('/api/registration', async (req, res) => {
        let referral;
        if(req.cookies.referral){
            referral = await to(mongoose.User.findOne({referralCode: req.cookies.referral}));
        }else{
            const items = await mongoose.User.find();
            referral = items[Math.floor(Math.random()*items.length)];
        }

        if (!req.body.email) return res.send({error: 203, message: "Email required"});
        if (!validator.isEmail(req.body.email)) return res.send({error: 203, message: "Wrong email"});

        const user = new mongoose.User({username: req.body.email, password: req.body.password, referral, referralCode: new Date().valueOf()});
        user.nickname = randomWords({
            exactly: 2, join: ' ', formatter: (word, index) => {
                return index === 0 ? word.slice(0, 1).toUpperCase().concat(word.slice(1)) : word;
            }
        }).substring(0, 120);
        const [err2] = await to(user.save());
        if (err2) return res.send(err2);

        const [err3, confirmation] = await to(mongoose.EmailConfirm.create({user, code: new Date().valueOf()}));
        if (err3) return res.send(err3);

        sendEmailConfirmation(user, confirmation);
        res.send({ok: 200})
    });


};