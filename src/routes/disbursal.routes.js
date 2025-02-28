const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');

// ...existing code...
router.post('/', StatusController.checkDisbursalStatus);

module.exports = router;