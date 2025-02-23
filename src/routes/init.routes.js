const express = require('express');
const InitController = require('../controllers/init.controller');
const router = express.Router();

router.post('/', InitController.onInit);

module.exports = router;