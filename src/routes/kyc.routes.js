const express = require('express');
const KycController = require('../controllers/kyc.controller');
const router = express.Router();

router.post('/', KycController.getKycForm);

module.exports = router;