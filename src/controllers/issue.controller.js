const { v4: uuidv4 } = require('uuid');
const DisbursedLoan = require('../models/disbursed.model');
const Issue = require('../models/issueschema');
const IssueRequestUtils = require('../utils/issuerqst.utils');
const IssueService = require('../services/issue.service');
const IssueMessageIds = require('../models/issuemessageids.model');
const IssueStatus = require('../models/issuestatus.mode');
const Transaction=require('../models/transaction.model');
const SelectThree=require('../models/selectThree.model')

const TempData = require('../models/tempdata');

class IssueController {
    static async createIssue(req, res) {
        try {
            console.log(req.body);
            
            const { 
                transactionId, 
                name, 
                phone, 
                email, 
                shortDesc, 
                longDesc 
            } = req.body;

            const loan = await DisbursedLoan.findOne({ transactionId });
            let loanress=null
            if(loan){
                loanress=loan.Response
            }
            
            let selectThreeData = null;
            let selectresss=null
            if (!loan) {
                selectThreeData = await SelectThree.findOne({ transactionId });
                selectresss=selectThreeData.selectPayload
                if (!selectThreeData) {
                    return res.status(404).json({ error: 'Transaction not found in DisbursedLoan or SelectThree' });
                }
            }
            
            
            const issuePayload =await IssueRequestUtils.createIssuePayload(loanress ||  selectresss, {
                name, phone, email, shortDesc, longDesc,transactionId
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
            if(tempData){
                console.log('Temp data saved successfully');
            }

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

            const issueId = message.issue.id;
            const transactionId= context.transaction_id
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        status: message.issue.issue_actions?.respondent_actions?.[0]?.respondent_action || 'PROCESSING',
                        'responseDetails.respondentActions': message.issue.issue_actions?.respondent_actions,
                        'responseDetails.updatedAt': message.issue.updated_at,
                        response:req.body,
                        updatedAt: new Date()
                    }
                }
            );


            const issue = await Issue.findOne({ 
                transactionId,
                issueId 
            });
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            const messageId = uuidv4();
            const statusPayload = {
                context: {
                    ...issue.requestDetails.payload.context,
                    action: "issue_status",
                    message_id: messageId,
                    timestamp: new Date().toISOString()
                },
                message: {
                    issue_id: issueId
                }
            };

            await IssueStatus.create({
                transactionId,
                messageId,
                issueId,
                status: 'PENDING',
                requestDetails: {
                    payload: statusPayload,
                    timestamp: new Date()
                }
            });

            const statusResponse = await IssueService.checkIssueStatus(statusPayload);

            // Update with response
            await IssueStatus.findOneAndUpdate(
                { messageId },
                {
                    $set: {
                        status: 'COMPLETED',
                        responseDetails: {
                            payload: statusResponse,
                            timestamp: new Date()
                        }
                    }
                }
            );
            res.status(200).json({
                message: 'Issue status request processed',
                response: statusResponse
            });

        } catch (error) {
            console.error('Issue response processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async getIssueStatus(req, res) {
        try {
            const { userId } = req.body;
    
            // Fetch all transactions for the user by ObjectId
            const transactions = await Transaction.find({ user: userId });
    
            if (!transactions.length) {
                return res.status(404).json({
                    message: "No transactions found for this user",
                });
            }
    
            // Extract transactionIds (string IDs, not MongoDB _id)
            const transactionIds = transactions.map(transaction => transaction.transactionId);
    
            // Find any issue statuses that match these transaction IDs
            const issueStatuses = await IssueStatus.find({
                transactionId: { $in: transactionIds }
            });
    
            // If no issue statuses found
            if (!issueStatuses.length) {
                return res.status(404).json({
                    message: "No issue statuses found for this user's transactions",
                });
            }
    
            // Format the response based on whether there's one or multiple results
            let response;
            if (issueStatuses.length === 1) {
                response = issueStatuses[0];
            } else {
                response = issueStatuses;
            }
    
            res.status(200).json({
                message: 'Issue status request processed',
                response: response
            });
    
        } catch (error) {
            console.error('Issue status check failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async onIssueStatus(req, res) {
        try {
            const { context, message } = req.body;
            
            // Save temp data
            await TempData.create({
                transactionId: context.transaction_id,
                messageId: context.message_id,
                responseData: req.body
            });
    
            // Update Issue Status
            await IssueStatus.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        'responseDetails.payload': req.body,
                        'responseDetails.timestamp': new Date(),
                        status: 'COMPLETED'
                    }
                }
            );
    
            // Update main Issue document
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        status: message.issue.issue_actions?.respondent_actions?.slice(-1)[0]?.respondent_action || 'PROCESSING',
                        resolution: message.issue.resolution,
                        respondentActions: message.issue.issue_actions?.respondent_actions,
                        resolutionProvider: message.issue.resolution_provider,
                        updatedAt: message.issue.updated_at
                    }
                }
            );
    
            res.status(200).json({
                message: 'Issue status updated successfully'
            });
    
        } catch (error) {
            console.error('Issue status update failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async completeIssue(req, res) {
        try {
            const { 
                transactionId, 
                issueId,
                shortDesc,
                longDesc 
            } = req.body;
    
            const issue = await Issue.findOne({ issueId });
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
    
            const messageId = uuidv4();
    
            // Create complete payload
            const completePayload = {
                context: {
                    ...issue.requestDetails.payload.context,
                    action: "issue",
                    message_id: messageId,
                    timestamp: new Date().toISOString()
                },
                message: {
                    issue: {
                        id: issueId,
                        complainant_info: issue.complainantInfo,
                        order_details: {
                            id: issue.requestDetails.payload.message.issue.order_details.id,
                            state: "Completed",
                            provider_id: issue.requestDetails.payload.message.issue.order_details.provider_id
                        },
                        description: {
                            short_desc: shortDesc || issue.description.shortDesc,
                            long_desc: longDesc || issue.description.longDesc,
                            additional_desc: {
                                url: ""
                            }
                        },
                        category: "LOAN",
                        issue_type: "ISSUE",
                        source: {
                            network_participant_id: issue.requestDetails.payload.context.bap_id,
                            type: "CONSUMER"
                        },
                        expected_response_time: {
                            duration: "PT2H"
                        },
                        expected_resolution_time: {
                            duration: "P1D"
                        },
                        status: "COMPLETE",
                        issue_actions: {
                            complainant_actions: [
                                {
                                    complainant_action: "COMPLETE",
                                    short_desc: "Issue marked as complete",
                                    updated_at: new Date().toISOString(),
                                    updated_by: {
                                        org: {
                                            name: issue.requestDetails.payload.context.bap_id
                                        },
                                        contact: issue.complainantInfo.contact,
                                        person: {
                                            name: issue.complainantInfo.name 
                                        }
                                    }
                                }
                            ]
                        },
                        created_at: issue.createdAt.toISOString(),
                        updated_at: new Date().toISOString()
                    }
                }
            };
    
            // Save message ID
            await IssueMessageIds.create({
                transactionId,
                messageId,
                issueId,
                type: 'ISSUE_COMPLETE',
                status: 'no'
            });
    
            // Send complete request
            const completeResponse = await IssueService.submitIssue(completePayload);
    
            // Update issue status
            await Issue.findOneAndUpdate(
                { issueId },
                {
                    $set: {
                        status: 'COMPLETE',
                        'requestDetails.completePayload': completePayload,
                        'responseDetails.completeResponse': completeResponse,
                        updatedAt: new Date()
                    }
                }
            );
    
            // Delete the document from IssueStatus
            const deleteResult = await IssueStatus.findOneAndDelete({ transactionId, issueId });
    
            if (!deleteResult) {
                console.warn(`No IssueStatus found for transactionId: ${transactionId}, issueId: ${issueId}`);
            }
    
            res.status(200).json({
                message: 'Issue marked as complete and IssueStatus entry deleted',
                completeResponse
            });
    
        } catch (error) {
            console.error('Issue completion failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
}

module.exports = IssueController;