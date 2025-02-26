const express = require('express');
const ConfirmController = require('../controllers/confirm.controller');
const router = express.Router();

router.post('/confirm', ConfirmController.confirm);
router.post('/', ConfirmController.onConfirm);

module.exports = router;