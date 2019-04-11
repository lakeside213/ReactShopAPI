const User = require('../models/User');
const jwt = require('jwt-simple');
const passportService = require('../services/passport');
const passport = require('passport');
const keys = require('../config/dev');
const requireAuth = require('../middlewares/requireAuth');
const requireSignin = require('../middlewares/requireSignin');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// TODO: install async and crypto
function userToken(user) {
  const timestap = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestap }, keys.SECRET_KEY);
}

module.exports = app => {
  app.post('/api/signin', requireSignin, function(req, res, next) {
    console.log('SENDING TOKEN');

    res.json({ token: userToken(req.user) });
  });

  app.post('/api/signup', function(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    const firstname = req.body.firstname;
    const surname = req.body.surname;

    if (!email || !password) {
      return res.send({
        message: 'Fill in your details correctly',
        isCreated: false
      });
    }
    //see if user exists
    User.findOne({ email: email }, function(err, existingUser) {
      if (err) {
        return res.status(500).send({ error: 'server issues' });
      }

      // If a user with email does exist, return an error
      if (existingUser) {
        return res.status(422).send({ error: 'Email is in use' });
      }

      //if user does not exist
      console.log('USER DOES NOT EXIST');
      const user = new User({
        firstname: firstname,
        surname: surname,
        email: email,
        password: password
      });

      console.log('USER' + user.email + 'PASS' + user.password);

      //save to database
      user.save(function(err) {
        if (err) {
          return next(err);
        }

        // Repond to request indicating the user was created
        res.json({ token: userToken(user) });
      });
    });
  });

  app.post('/api/forgot', function(req, res, next) {
    async.waterfall(
      [
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
              return res
                .status(422)
                .send({ error: 'No account with that email address exists.' });
            }
            console.log('reached here');
            console.log(req.headers.host);
            console.log('reached here');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function(err) {
              if (err) {
                return res.status(500).send({
                  error: 'an error occured;'
                });
              }
              done(err, token, user);
            });
            console.log(user);
          });
        },
        function(token, user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'kokulekan23@gmail.com',
              pass: 'rose1969'
            }
          });
          var mailOptions = {
            //to: user.email,
            to: 'kokulekan23@gmail.com',
            from: 'no-reply@shfglobal.com',
            subject: 'Password Reset',
            text:
              'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' +
              req.headers.host +
              '/auth' +
              '/reset/' +
              token +
              '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            const instruction =
              'An e-mail has been sent to ' +
              user.email +
              ' with further instructions.';
            res.send({ info: instruction });
            done(err, 'done');
          });
        }
      ],
      function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
      }
    );
  });

  app.post('/api/reset', function(req, res) {
    User.findOne(
      {
        resetPasswordToken: req.body.token,
        resetPasswordExpires: { $gt: Date.now() }
      },
      function(err, user) {
        if (!user) {
          return res.status(404).send({
            error: 'Password reset token is invalid or has expired.'
          });
        }
      }
    );
  });
  app.post('/api/reset/confirm', function(req, res) {
    async.waterfall(
      [
        function(done) {
          console.log(req.body.token);
          User.findOne(
            {
              resetPasswordToken: req.body.token,
              resetPasswordExpires: { $gt: Date.now() }
            },
            function(err, user) {
              if (!user) {
                return res.status(404).send({
                  error: 'Password reset token is invalid or has expired.'
                });
              }

              user.password = req.body.password;
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;

              user.save(function(err) {
                if (err) {
                  return res.status(500).send({
                    error: 'an error occured'
                  });
                }
                done(err, user);
              });
            }
          );
        },
        function(user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'kokulekan23@gmail.com',
              pass: 'rose1969'
            }
          });
          var mailOptions = {
            //to: user.email,
            to: 'kokulekan23@gmail.com',
            from: 'passwordreset@demo.com',
            subject: 'Your password has been changed',
            text:
              'Hello,\n\n' +
              'This is a confirmation that the password for your account ' +
              user.email +
              ' has just been changed.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            res
              .status(200)
              .send({ success: 'Success! Your password has been changed.' });
            done(err);
          });
        }
      ],
      function(err) {
        res.redirect('/');
      }
    );
  });
};
