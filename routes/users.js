var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');


var storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
        var dest = 'public/images/uploads/';
        //   mkdirp.sync(dest);
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({ storage: storage }).single('profileimage');


var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {
    'title': 'Register'
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', {
    'title': 'Login'
  });
});

router.post('/register', function(req, res, next) {
  upload(req, res, function (err) {
    
    // Get the form values
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var profileImageName = '';

    // Check for image field
    if(req.file) {
      console.log('Uploading file...');

      // File info (gets the filename)
      profileImageName = req.file.filename;
    } else {
      // Set a default image
      console.log('No file uploaded...');
      profileImageName = 'noimage.png';
    
    }
    
     if (err) {
        // An error occurred when uploading
        //   res.render('index', {
        //       'errors': err
        //   });
        console.log(err);
     }
        

    // Form validation
    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Not a valid email').isEmail();
    req.checkBody('username', 'Username field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    // Checks for errors
    var errors = req.validationErrors();

    if(errors) {
      res.render('register', {
        errors: errors,
        name: name,
        email: email,
        username: username,
        password: password,
        password2: password2
    });
    } else {
        var newUser = new User({
        name: name,
        email: email,
        username: username,
        password: password,
        profileimage: profileImageName
      });

    // Create user
    User.createUser(newUser, function(err, user) {
      if (err) throw err;
      console.log(user);
    });

    // Success message
    req.flash('success', 'You are now registered and may now log in.');

    res.location('/');
    res.redirect('/');
    }
  });
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
      User.getUserByUsername(username, function(err, user) {
        if(err) throw err;
        if(!user){
          console.log('Unknown User');
          return done(null, false, {message: 'Unknown User'});
        }

        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            console.log('Invalid Password');
            return done(null, false, {message: 'Invalid Password'});
          }
        });
      });
    }
));

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/users/login',
  failureFlash: 'Invalid username or password'
}), function(req, res) {
  console.log('Authentication Successful');
  req.flash('success', 'You are logged in');
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success', 'You have logged out');
  res.redirect('/users/login');
});

module.exports = router;
