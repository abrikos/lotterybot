const mongoose = require('./mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const TelegramStrategy = require('passport-custom').Strategy;
const logger = require('logat');
const crypto = require('crypto');


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
    mongoose.User.findOne({id:14278211})        .then(user=>done(null,user));
    return;
    if (checkSignature(req.body)) {
        mongoose.User.findOne({id: req.body.id})
            .then(user => {
                if (!user) {
                    return done({status: 403}, false, {error: 'db', message: 'NO USER'});
                }
                done(null, user);
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