const express = require('express');
const BankController = require('../controllers/bank.controller');
const router = express.Router();

router.post('/', BankController.submitBankDetails);

module.exports = router;