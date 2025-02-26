const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/status.controller');

router.post('/', StatusController.getNoFormStatus);
module.exports = router;