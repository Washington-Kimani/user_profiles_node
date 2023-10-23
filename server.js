const express = require('express');
require('dotenv').config();
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const http = require('http');
const bcrypt =  require('bcrypt');

//User Model required
const User = require('./models/user');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.Server(app);

//MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

//Passport Setup
app.use(session({ secret: 'ae830b2c858d59e13a2f63ff39ddbe96885f550d', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

//View Engine
app.set('view engine', 'hbs');

//Connecting to the database
mongoose.connect(process.env.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(`MongoDB Connected...`)
}).catch((err) => {
    console.log(err);
});


//Serialize and Deserialize Users
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//My Middleware functions
passport.use(new localStrategy(function (username, password, done) {
    User.findOne({ username: req.body.username }, function (err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Incorrect username.' });

        bcrypt.compare(password, req.body.password, function (err, res) {
            if (err) return done(err);
            if (res === false) return done(null, false, { message: 'Incorrect password.' });

            return done(null, user);
        });
    });
}));


//MY MIDDLEWARES

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/');
}

function checkEmail (req, res, next){
   let user = User.findOne({email: req.body.email});
   if(!user){
    next();
   }

   res.render('Error',{title: "Error Page",error: "The email is already in use!!!", email: req.body.email})
}

// ROUTES
app.get('/', isLoggedIn, (req, res) => {
    res.render("Home", { title: "Home" });
});

app.get('/about', (req, res) => {
    res.render("Home", { title: "About" });
});

app.get('/login', isLoggedOut, (req, res) => {
    const response = {
        title: "Login",
        error: req.query.error
    }

    res.render('login', response);
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=true'
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/signup', (req, res) => {
    res.render('Signup');
});

app.post('/signup', checkEmail, async (req,res)=>{
    const {username,email, password} = req.body;
    const hash = await bcrypt.hash(password, 10);

    const user = new User({
        username,
        email,
        password: hash
    });

    await user.save().then(()=>{
        res.redirect('/Login');
    });
    
});


server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))