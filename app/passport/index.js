// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

//load the crypto module.
var crypto = require('crypto');
var nodemailer = require('nodemailer');

const User = require('../models/user');

module.exports = function (passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });


  // =========================================================================
  // LOCAL ADMIN SIGNIN ======================================================
  // =========================================================================
  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
    function (req, email, password, done) {
      if (email)
        email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
      // asynchronous
      process.nextTick(function () {
        User.findOne({
          'email': email
        }, function (err, user) {
          // if there are any errors, return the error
          if (err) return done(err);

          // if no user is found, return the message
          else if (!user) {
            return done(null, false, {
              success: false,
              message: 'No user found.'
            });
          }

          // if password is invalid, return message
          else if (!user.validPassword(password)) {
            return done(null, false, {
              success: false,
              message: 'Oops! Wrong password.'
            });
          }

          // if email hasn't been confirmed, return message
          else if (!user.isEmailConfirmed()) {
            return done(null, false, {
              success: false,
              email: user.email,
              message: 'Your email has not been confirmed yet.'
            });
          }

          // all is well, return user
          else
            return done(null, user);
        });
      });
    }));


  // =========================================================================
  // LOCAL ADMIN SIGNUP ======================================================
  // =========================================================================
  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
    function (req, email, password, done) {
      if (email)
        email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
      // asynchronous
      process.nextTick(function () {
        // if the user is not already logged in:
        if (!req.user) {
          User.findOne({
            'email': email
          }, function (err, user) {
            // if there are any errors, return the error
            if (err)
              return done(err);

            // check to see if theres already a user with that email
            if (user) {
              return done(null, false, {
                success: false,
                message: 'That email is already taken.'
              });
            }

            // if everything is good register the user information and wait for email verification
            else {

              var emailHash = crypto.randomBytes(20).toString("hex");
              // create the user
              var newUser = new User();
              newUser.email = email;
              newUser.password = newUser.generateHash(password);
              newUser.name = req.body.name;
              newUser.emailConfirmed = false;
              newUser.emailConfirmationToken = emailHash;

              newUser.save(function (err) {
                if (err) {
                  return done(err);
                }

                var smtpTransport = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: 'fviclass@gmail.com',
                    pass: 'fviclass2017'
                  }
                });
                var mailOptions = {
                  to: email,
                  from: 'Email Confirmation',
                  subject: 'Verification Code',
                  text: "Please click in link below to confirm your email or copy and paste in your browser url bar \n\n http://" + req.headers.host + "/admin-email-confirmation/" + emailHash,
                  html: "<p>Please click in the link below to <br/><a href='http://" + req.headers.host + "/admin-email-confirmation/" + emailHash + "'>" +
                    "confirm email address" +
                    "</a>\n\n</p>"
                };
                smtpTransport.sendMail(mailOptions);
                //Sets it to false to redirect the user to the login page.
                return done(null, newUser, {
                  success: true,
                  message: 'A verification email has been sent to ' + email
                });
              });
            }
          });
          // if the user is logged in but has no local account...
        } else if (!req.user.email) {
          // ...presumably they're trying to connect a local account
          // BUT let's check if the email used to connect a local account is being used by another user
          User.findOne({
            'email': email
          }, function (err, user) {
            if (err)
              return done(err);

            if (user) {
              return done(null, false, {
                message: 'That email is already taken.'
              });
              // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
            } else {
              var user = req.user;
              user.email = email;
              user.password = user.generateHash(password);
              user.save(function (err) {
                if (err)
                  return done(err);

                return done(null, user);
              });
            }
          });
        } else {
          // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)

          return done(null, req.user);
        }
      });
    }));


  // =========================================================================
  // LOCAL PROFILE UPDATE  ===================================================
  // =========================================================================
  passport.use('local-user-profile-update', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
    function (req, email, password, done) {
      if (email)
        email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
      // asynchronous
      process.nextTick(function () {
        // if the user is not already logged in:
        if (!req.user) {
          return done(null, false, {
            success: false,
            message: "You must be logged in to update your profile information"
          });
        }
        // if password is invalid, return message
        if (!req.user.validPassword(password)) {
          return done(null, false, {
            verified: true,
            message: 'Oops! Wrong password.'
          });
        }

        else {
          var user = req.user;

          if (req.body.newPassword && req.body.confirmNewPassword && req.body.newPassword === req.body.confirmNewPassword) {
            user.password = user.generateHash(req.body.newPassword);
          }

          user.name = req.body.name;

          user.save(function (err) {
            if (err)
              return done(err);

            return done(null, user, {
              success: true,
              message: "Profile updated successfully!"
            });
          });
        }
      });
    }));
};
