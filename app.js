const express = require ('express')
const app = express()

app.get ('/', (req, res) => res.send('Hello! from staging environment-1'))
app.listen(3000, () => console.log('Server ready'))
