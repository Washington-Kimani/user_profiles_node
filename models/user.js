const mongoose  = require('mongoose');
require('dotenv').config();



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        rquired: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);