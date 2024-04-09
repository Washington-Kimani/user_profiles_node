const mongoose = require('mongoose');
require('dotenv').config();



const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    image: {
        data: Buffer,
        contentType: String
    },
    username: {
        type: String,
        rquired: true
    },
    department: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);