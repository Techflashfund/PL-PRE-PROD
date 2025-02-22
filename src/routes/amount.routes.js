const express = require('express');
const AmountController = require('../controllers/amount.controller');
const router = express.Router();

router.post('/submit-amount', AmountController.submitAmount);

module.exports = router;