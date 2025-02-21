const express = require('express');
const SelectController = require('../controllers/select.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateSearch = require('../middleware/validate.search');

const router = express.Router();


router.post('/', SelectController.onSelect);

module.exports = router;