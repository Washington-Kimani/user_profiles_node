const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user.js');

const passportStrategy = () => {
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
};

module.exports = passportStrategy;