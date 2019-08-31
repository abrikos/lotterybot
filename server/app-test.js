const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/api/login/telegram', (req, res) => {
    console.log(req.body)
    res.send({ok:'zzzzzzzzzzz'})
});

module.exports = app;