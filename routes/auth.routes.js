const router = require('express').Router();
const multer = require('multer');
const signUp = require('../controllers/auth.controllers.js');


//Setting Up Multer
const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single('image');

// Sign up a new user;
router.post('/signup', multerUploads, signUp);


module.exports = router;