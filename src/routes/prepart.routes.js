const express = require('express');
const router = express.Router();
const PrePaymentController = require('../controllers/prepartpayment.controller');

router.post('/initiate', PrePaymentController.initiatePrePayment);
router.post('/', PrePaymentController.initiatemissedemi);

module.exports = router;