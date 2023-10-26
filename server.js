const express = require('express');
require('dotenv').config();
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const http = require('http');
const multer = require('multer');
const bcrypt =  require('bcrypt');
const uuid = require('uuid');

//User Model required
const User = require('./models/user');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.Server(app);

//MIDDEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'))
//view engine
app.set('view engine', 'hbs');
//session
app.use(session({
    secret: uuid.v4(),
    resave: true,
    saveUninitialized: true
}));

//Connect To Database
mongoose.connect(process.env.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to database...');
}).catch((error) => {
    console.log(error);
})


//passport
app.use(passport.initialize());
app.use(passport.session());


passport.use(new localStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username });

            if (!user) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            // If the user is found and the password is correct, invoke the done function with the user object
            return done(null, user);
        } catch (error) {
            return done(error); // Handle the error appropriately
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error); // Handle the error appropriately
    }
});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/');
}

//Setting Up Multer
const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single('image');

app.get('/', isLoggedIn, (req, res) => {
    const imageBuffer = req.user.image.data.toString('base64');
    const imageBase64 = `data:${req.user.image.contentType};base64,${imageBuffer}`;
    const name = req.user.username.split(' ')[0]
    res.render('Home', { title: `${name} Home Page`, user: req.user, image: imageBase64 });
});

app.get('/users', isLoggedIn, async (req, res)=>{
    const users = await User.find();
    const data = {
        users: users.map(user => ({
            id: user._id,
            name: user.username,
            email: user.email,
            image: `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`,
        })),
    };
    res.render('Users', {title: 'All Users Page', data});
});

app.get('/user/:id', isLoggedIn, async(req, res)=>{
    User.findOne({
        _id: req.params.id
    }).then(data => {
        const imageBuffer = data.image.data.toString('base64');
        const imageBase64 = `data:${req.user.image.contentType};base64,${imageBuffer}`;
        res.render('User', { data: data, title: data.username, image: imageBase64});
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


// Sign up a new user;
app.post('/signup', multerUploads, async (req, res) => {
    let { username, email, password } = req.body;
    const exists = await User.exists({ email: email });

    if (exists) {
        res.render('Error',{email: req.body.email});
        return;
    };

    // console.log(req.body);
    // console.log(req.file);

    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(password, salt, function (err, hash) {
            if (err) return next(err);

            const newUser = new User({
                name: username,
                image: {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                },
                username: username,
                email: email,
                password: hash
            });

            newUser.save();

            res.redirect('/');
        });
    });
});


server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))