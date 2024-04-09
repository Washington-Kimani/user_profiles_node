const bcrypt = require('bcrypt');
const User = require('../models/user.js');

const signUp = async (req, res) => {
    let { username, department, email, password } = req.body;
    const exists = await User.exists({ email: email });

    if (exists) {
        res.render('Error', { email: req.body.email });
        return;
    };

    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(password, salt, function (err, hash) {
            if (err) return next(err);

            const newUser = new User({
                name: username,
                image: {
                    data: req.file?.buffer,
                    contentType: req.file?.mimetype
                },
                username,
                department,
                email,
                password: hash
            });

            newUser.save();

            res.redirect('/');
        });
    });
}

module.exports = signUp;