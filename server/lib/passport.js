const mongoose = require('./mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const TelegramStrategy = require('passport-custom').Strategy;
const GoogleStrategy = require('passport-google-oauth').Strategy;
const logger = require('logat');
const crypto = require('crypto');
const config = require('../../client/lib/config')

passport.use(new LocalStrategy({passReqToCallback: true},
    function (req, username, password, done) {
        mongoose.User.findOne({username})
            .then(user => {
                if (!user) {
                    return done(null, false, {error: 'username', message: 'Incorrect username.'});
                }
                if (!user.validPassword(password)) {
                    return done(null, false, {error: 'password', message: 'Incorrect password.'});
                }
                if (!user.emailConfirmed) {
                    return done(null, user, {error: 'email-confirm', message: 'Email not confirmed.'});
                }
                //return done(null, null, {error: 'test-endpoint', message: 'TEST WRONG login.'});
                return done(null, user, {});
            })
            .catch(done)
        ;
    }
));

passport.use('telegram', new TelegramStrategy(function (req, done) {
    if (checkSignature(req.body)) {
        mongoose.User.findOrCreate({telegramId: req.body.id}, {telegramId: req.body.id, referralCode: new Date().valueOf(), nickname:req.body.first_name, emailConfirmed: true}, (error, user) => {
            if (error) return done(error, false, {error: 'db', message: error.message});
            done(null, user);
            if(!user.nickname){
                user.nickname = req.body.first_name;
                user.save();
            }
        })

    } else {
        done(null, false, {error: 'wrong-data', message: 'Wrong POST data.'});
    }
}));


function checkSignature({hash, ...data}) {
    const TOKEN = process.env.TELE_BOT;
    const secret = crypto.createHash('sha256')
        .update(TOKEN)
        .digest();
    const checkString = Object.keys(data)
        .sort()
        .map(k => (`${k}=${data[k]}`))
        .join('\n');
    const hmac = crypto.createHmac('sha256', secret)
        .update(checkString)
        .digest('hex');
    return hmac === hash;
}


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

module.exports = {
    initialize: passport.initialize,
    session: passport.session,
    checkSignature,

    isLogged: function (req, res, next) {
        if (req.session.passport) {
            //console.log('AUTHENTICATED')
            return next()
        } else {
            //hconsole.error('DENIED')
            res.sendStatus(401);
        }
    },

    loginLocal: passport.authenticate('local'),
    loginGithub: passport.authenticate('github'),

}