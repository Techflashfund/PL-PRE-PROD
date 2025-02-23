const express = require('express');
const StatusController = require('../controllers/status.controller');
const router = express.Router();

router.post('/', StatusController.onStatus);

module.exports = router;