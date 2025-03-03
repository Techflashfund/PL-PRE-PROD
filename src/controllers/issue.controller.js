const DisbursedLoan = require('../models/disbursed.model');
const Issue = require('../models/issueschema');
const IssueRequestUtils = require('../utils/issuerqst.utils');
const IssueService = require('../services/issue.service');
const IssueMessageIds = require('../models/issuemessageids.model');

class IssueController {
    static async createIssue(req, res) {
        try {
            const { 
                transactionId, 
                name, 
                phone, 
                email, 
                shortDesc, 
                longDesc 
            } = req.body;

            const loan = await DisbursedLoan.findOne({ transactionId });
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }

            const issuePayload = IssueRequestUtils.createIssuePayload(loan, {
                name, phone, email, shortDesc, longDesc
            });

            const issueResponse = await IssueService.submitIssue(issuePayload);

            await Issue.create({
                transactionId,
                issueId: issuePayload.message.issue.id,
                complainantInfo: {
                    name,
                    phone,
                    email
                },
                description: {
                    shortDesc,
                    longDesc
                },
                requestDetails: {
                    payload: issuePayload,
                    timestamp: new Date()
                },
                responseDetails: {
                    payload: issueResponse,
                    timestamp: new Date()
                }
            });

            res.status(200).json({
                message: 'Issue created successfully',
                issueId: issuePayload.message.issue.id,
                response: issueResponse
            });

        } catch (error) {
            console.error('Issue creation failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async onIssue(req, res) {
        try {
            const { context, message } = req.body;
            
            // Save request to temp data
            const tempData = await TempData.create({
                transactionId: context.transaction_id,
                messageId: context.message_id,
                responseData: req.body
            });

            // Find and update message ID status
            const issueMessageId = await IssueMessageIds.findOne({
                issueId: message.issue.id
            });

            if (issueMessageId) {
                await IssueMessageIds.findOneAndUpdate(
                    { issueId: message.issue.id },
                    { status: 'yes' }
                );
            }

            // Update issue details
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        status: message.issue.issue_actions?.respondent_actions?.[0]?.respondent_action || 'PROCESSING',
                        'responseDetails.respondentActions': message.issue.issue_actions?.respondent_actions,
                        'responseDetails.updatedAt': message.issue.updated_at,
                        updatedAt: new Date()
                    }
                }
            );

            res.status(200).json({
                message: 'Issue response processed successfully'
            });

        } catch (error) {
            console.error('Issue response processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = IssueController;