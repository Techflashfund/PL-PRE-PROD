const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');

// ...existing routes...
router.post('/', StatusController.checkCompletedLoan);

module.exports = router;