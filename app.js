const express = require ('express')
const app = express()

app.get ('/', (req, res) => res.send('Hello New Devops Team'))
app.listen(3000, () => console.log('Server ready'))
