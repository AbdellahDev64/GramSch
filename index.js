const express = require("express");

const app = express()
const port = 8080


app.get('/', (req, res) => {
    res.send('I\'m Live :)')
})
app.listen(port, () => {
    console.log(`I'm Live in ${port} :)`)
})
