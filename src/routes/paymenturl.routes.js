const express = require('express');
const router = express.Router();
const UpdateController = require('../controllers/update.controller');

// ...existing routes...

router.get('/:transactionId', UpdateController.getPaymentUrl);

module.exports = router;