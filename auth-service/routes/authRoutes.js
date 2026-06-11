const express = require('express');

const router = express.Router();

const upload =
    require('../middleware/upload');

const {
    signup,
    login
} = require('../controllers/authController');


// SIGNUP

router.post(
    '/signup',
    upload.single('profilePicture'),
    signup
);


// LOGIN

router.post(
    '/login',
    login
);


module.exports = router;