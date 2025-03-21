const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');

router.post('/', StatusController.checkLoanStatus);
router.post('/completed', StatusController.checkCompletedLoanStatus);
module.exports = router;