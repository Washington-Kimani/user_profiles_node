const mongoose = require('mongoose');
require('dotenv').config()


const connectDb = () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to database...');
    }).catch((error) => {
        console.log(error);
    });
}

module.exports = connectDb;