const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const db = require('./end-points/v1/wallet-app-dal')
const port = 3010

const app = express()
app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// Test Route
app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

// Routes
app.get('/users', db.getUsers) // unused - admin purposes
app.get('/users/:id', db.getUserById)
app.post('/users/login', db.loginUserByEmailPwd)
app.post('/users/newUser', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.post('/cards', db.getUserCards) // post method because we are passing in id to get respective cards
app.get('/cards/:id', db.getCardById)
app.post('/cards/newCard', db.createNewCard)
app.put('/cards/:id', db.updateCard)
app.delete('/cards/:id', db.deleteCard)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})