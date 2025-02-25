const express = require('express');
const MandateController = require('../controllers/mandate.controller');
const router = express.Router();

router.post('/', MandateController.getMandateForm);

module.exports = router;