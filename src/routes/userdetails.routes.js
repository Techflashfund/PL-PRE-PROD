const express = require('express');
const UserDetailsController = require('../controllers/userdetails.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/submit/:userId', authMiddleware, UserDetailsController.submitForm);

module.exports = router;