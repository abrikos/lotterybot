require = require("esm")(module)

const logger = require('logat')
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const passport = require('passport');
const mailer = require('express-mailer');
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo')(session);
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();



app.set('views', __dirname + '/views');
app.set('view engine', 'pug');


mailer.extend(app, JSON.parse(process.env.mailer));


app.use(cors())
app.use(fileUpload());
app.use(passport.initialize());
app.use(passport.session());


app.use(session({
    key: 'sesscookiename',
    secret: 'keyboard sadasd323',
    resave: false,
    cookie: {_expires: 60000000},
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));

//app.use(flash());
app.use(function (req, res, next) {
    res.locals.config = require('../client/lib/config');
    res.locals.currentUrl = req.url;
    res.locals.currentSite = req.protocol + '://' + req.headers.host;
    res.locals.authenticated = req.session.passport;
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
//require('./authentication').init(app)


fs.readdirSync(__dirname + '/controllers').forEach(function (file) {
    if(file.substr(-3) === '.js') {
        require(__dirname + '/controllers/' + file).controller(app);
    }
});





module.exports = app;
