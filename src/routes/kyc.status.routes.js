const express = require('express');
const KycStatusController = require('../controllers/kycstatus.controller'); 
const router = express.Router();

router.post('/kyc-status', KycStatusController.getKycStatus);

module.exports = router;