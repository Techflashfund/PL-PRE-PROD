const express = require('express');
const OffersController = require('../controllers/offer.controller');
const router = express.Router();

router.post('/offers', OffersController.getOffers);

module.exports = router;