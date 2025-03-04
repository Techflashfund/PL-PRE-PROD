const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issue.controller');


router.post('/check', IssueController.getIssueStatus);
router.post('/', IssueController.onIssueStatus);
module.exports = router;