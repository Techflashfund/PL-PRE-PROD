const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issue.controller');

router.post('/create', IssueController.createIssue);
router.post('/complete', IssueController.completeIssue);
router.post('/', IssueController.onIssue);
router.get('/status/:issueId', IssueController.checkIssueStatusById);

module.exports = router;