const express = require('express');
require('dotenv').config();
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('passport');
const http = require('http');
const uuid = require('uuid');
const connectDb = require('./db/connectDB.js');
const User = require('./models/user.js');
const authRoutes = require('./routes/auth.routes.js');
const passportStrategy = require('./controllers/passport.controller.js');


const PORT = process.env.PORT || 3000;
const app = express();
const server = http.Server(app);

//MIDDEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use('/', authRoutes);
//view engine
app.set('view engine', 'hbs');
//session
app.use(session({
    secret: uuid.v4(),
    resave: true,
    saveUninitialized: true
}));

//Connect To Database
connectDb();


//passport
app.use(passport.initialize());
app.use(passport.session());


//pasport strategy
passportStrategy();


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/');
}



app.get('/', isLoggedIn, (req, res) => {
    const imageBuffer = req.user.image?.data?.toString('base64');
    const imageBase64 = imageBuffer === undefined ? '/images/avatar.jpg' : `data:${req.user.image.contentType};base64,${imageBuffer}`;
    const name = req.user.username.split(' ')[0]
    res.render('Home', { title: `${name} Home Page`, user: req.user, image: imageBase64 });
});

app.get('/users', isLoggedIn, async (req, res) => {
    const users = await User.find();
    const data = {
        users: users.map(user => ({
            id: user._id,
            name: user.username,
            email: user.email,
            image: user?.image?.data?.toString() === undefined ? '/images/avatar.jpg' : `data:${user?.image?.contentType};base64,${user?.image?.data?.toString('base64')}`,
        })),
    };
    res.render('Users', { title: 'All Users Page', data });
});

app.get('/user/:id', isLoggedIn, async (req, res) => {
    User.findOne({
        _id: req.params.id
    }).then(data => {
        const imageBuffer = data?.image?.data?.toString('base64');
        const imageBase64 = imageBuffer === undefined ? '/images/avatar.jpg' : `data:${req.user.image.contentType};base64,${imageBuffer}`;
        // console.log(imageBase64);
        res.render('User', { data: data, title: data.username, image: imageBase64 });
    }).catch(err => console.log(err));
})

app.get('/signup', (req, res) => {
    res.render('Signup', { title: 'Sign Up Page' });
});

app.get('/login', isLoggedOut, (req, res) => {
    const response = {
        title: 'Login',
        error: req.query.error
    }
    res.render('Login', response);
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=true'
}));

app.delete('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            // Handle any errors that occur during logout
            res.send(err)
        }
        // Redirect or perform any other necessary actions after successful logout
        res.redirect('/login')
    });

});


server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))