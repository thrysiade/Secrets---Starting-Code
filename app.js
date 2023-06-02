require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");


const app = express();

// mongo setup
require('./utils/db');
const User = require("./model/user");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// ----------------------
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const newUser = {
            email: req.body.username,
            password: req.body.password
        }
        await User.create(newUser);
        res.render('secrets');
    } catch (error) {
        res.send(error);
    }
});

app.post('/login', async(req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const user = await User.findOne({ email: username});
        if(user) {
            if(user.password === password) {
                res.render('secrets');
            } else {
                res.send("Incorrect password!");
            }
        } else {
            res.send("You haven't register.")
        }
    } catch (error) {
        res.send(error);
    }
});



app.listen(3000, function() {
    console.log("Server started on port 3000");
});