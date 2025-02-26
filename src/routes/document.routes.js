const express = require('express');
const DocumentController = require('../controllers/document.controller');
const router = express.Router();

router.post('/', DocumentController.getDocumentForm);

module.exports = router;