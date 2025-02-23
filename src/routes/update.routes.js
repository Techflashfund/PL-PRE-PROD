const express = require('express');
const UpdateController = require('../controllers/update.controller');
const router = express.Router();

router.post('/update', UpdateController.update);
router.post('/', UpdateController.onupdate);

module.exports = router;