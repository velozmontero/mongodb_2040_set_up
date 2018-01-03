/*
    Express template
*/
var port = 8867;
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var session = require('express-session');
var mongo = require('./config')();

var passport = require('passport');

require('./app/passport')(passport); // pass passport for configuration

app.set('view engine', 'ejs'); // set up ejs for templating

//purpose of this is to enable cross domain requests
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));

// required for passport
app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'secretsecretsecretpaper',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use("/assets", express.static(__dirname + "/assets"));

require('./app/routes')(app, passport);

app.listen(port);

console.log("Server listening on port " + port);