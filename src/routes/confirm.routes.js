const express = require('express');
const ConfirmController = require('../controllers/confirm.controller');
const router = express.Router();

router.post('/confirm', ConfirmController.confirm);
router.post('/', ConfirmController.onconfirm);

module.exports = router;