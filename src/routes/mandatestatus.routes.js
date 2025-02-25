const express = require('express');
const MandateStatusController = require('../controllers/mandateStatus.controller');
const router = express.Router();

router.post('/', MandateStatusController.getMandateStatus);

module.exports = router;