const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issue.controller');

router.post('/create', IssueController.createIssue);
router.post('/', IssueController.onIssue);

module.exports = router;