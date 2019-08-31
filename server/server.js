const app = require('./app')
const port = process.env.PORT || 3003

app.listen(port, 'localhost',function (err) {
    if (err) {
        throw err
    }

    console.log(`server is listening on ${port}...`)
})