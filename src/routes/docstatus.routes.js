const express = require('express');
const DocumentStatusController = require('../controllers/documentStatus.controller');
const router = express.Router();

router.post('/', DocumentStatusController.getDocumentStatus);

module.exports = router;