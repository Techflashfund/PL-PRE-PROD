const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validate.middleware');

const router = express.Router();

router.post('/signup',
    [
        body('email').isEmail(),
        body('phone').matches(/^\+?[\d\s-]+$/),
        body('password').isLength({ min: 6 }),
        validateRequest
    ],
    authController.signup
);

router.post('/verify-email',
    [
        body('email').isEmail(),
        body('otp').isLength({ min: 6, max: 6 }),
        validateRequest
    ],
    authController.verifyEmail
);

router.post('/login',
    [
        body('email').isEmail(),
        body('password').exists(),
        validateRequest
    ],
    authController.login
);

module.exports = router;