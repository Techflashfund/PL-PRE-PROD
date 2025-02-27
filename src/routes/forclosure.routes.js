const express = require('express');
const ForeclosureController = require('../controllers/foreclosure.controller');
const router = express.Router();

router.post('/', ForeclosureController.initiateForeclosure);

module.exports = router;