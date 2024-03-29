require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();

// session middleware
app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false
}));

// Initialise passport and use passport to manage session
app.use(passport.initialize());
app.use(passport.session());

// mongo setup
require('./utils/db');
const User = require("./model/user");

// create local login strategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// ----------------------
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/secrets', async (req, res) => {
    // if(req.isAuthenticated()) {
    //     res.render('secrets');
    // } else {
    //     res.redirect('/login');
    // }

    const foundUser = await User.find({"secret": {$ne: null}});
    if(!foundUser) {
        res.send('error')
    } else {
        res.render('secrets', { usersWithSecrets: foundUser });
    };
});

// Submit secret area
app.get('/submit', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

app.post('/register', (req, res) => {

    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local') (req, res, () => {
                res.redirect('secrets');
            });
        }
    })
});

app.post('/login', async (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local') (req, res, () => {
                res.redirect('secrets');
            });
        }
    })
});

app.post('/submit', async (req, res) => {
    const submittedSecret = req.body.secret;

    const user = await User.findById(req.user.id).exec();
    if(!user) {
        console.log("error")
    } else {
        user.secret = submittedSecret;
        user.save();
        res.redirect('/secrets');
    };
});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { console.log(err) };
      res.redirect('/');
    });
  });

app.listen(3000, function() {
    console.log("Server started on port 3000");
});