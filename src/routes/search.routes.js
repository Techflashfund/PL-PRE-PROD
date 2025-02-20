const express = require('express');
const SearchController = require('../controllers/search.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateSearch = require('../middleware/validate.search');

const router = express.Router();

router.post('/one', 
    authMiddleware,
    validateSearch,
    SearchController.searchRequest  
);

router.post('/', SearchController.onSearch);

module.exports = router;