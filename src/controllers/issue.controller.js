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
const { response } = require('express');

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
                longDesc,
                category,
                sub_category
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
                name, phone, email, shortDesc, longDesc,transactionId,category,
                sub_category
            });

            const issueResponse = await IssueService.submitIssue(issuePayload);

            await Issue.create({
                transactionId,
                issueId: issuePayload.message.issue.id,
                category,
                sub_category,
                complainantInfo: {
                    name,
                    phone,
                    email
                },
                description: {
                    shortDesc,
                    longDesc,
                    additional_desc: {
                        url: "",
                        content_type: "text/plain"
                    },
                    images: []
                },
                requestDetails: {
                    payload: issuePayload,
                    timestamp: new Date()
                },
                responseDetails: {
                    payload: issueResponse,
                    timestamp: new Date()
                },
                status: 'OPEN'
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
            await TempData.create({
                transactionId: context.transaction_id,
                messageId: context.message_id,
                responseData: req.body
            });
    
            // Find and update message ID status
            await IssueMessageIds.findOneAndUpdate(
                { issueId: message.issue.id },
                { status: 'yes' }
            );
    
            // Extract respondent actions
            const respondentActions = message.issue.issue_actions?.respondent_actions?.map(action => ({
                respondentAction: action.respondent_action,
                shortDesc: action.short_desc,
                updatedAt: new Date(action.updated_at),
                updatedBy: {
                    org: {
                        name: action.updated_by?.org?.name
                    },
                    contact: {
                        phone: action.updated_by?.contact?.phone,
                        email: action.updated_by?.contact?.email
                    },
                    person: {
                        name: action.updated_by?.person?.name
                    }
                },
                cascadedLevel: action.cascaded_level
            })) || [];
    
            // Update Issue document
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        status: message.issue.issue_actions?.respondent_actions?.[0]?.respondent_action || 'PROCESSING',
                        respondentActions: respondentActions,
                        'responseDetails.payload': req.body,
                        'responseDetails.timestamp': new Date(message.issue.updated_at),
                        'responseDetails.respondentActions': message.issue.issue_actions?.respondent_actions,
                        response: req.body,
                        updatedAt: new Date(message.issue.updated_at)
                    }
                },
                { new: true }
            );
    
            res.status(200).json({
                message: 'Issue response processed successfully'
            });
    
        } catch (error) {
            console.error('Issue response processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async checkIssueStatusById(req, res) {
        try {
            const { issueId } = req.params;
            const issue = await Issue.findOne({ issueId });
            
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
    
            const messageId = uuidv4();
            const statusPayload = {
                context: {
                    domain: "ONDC:FIS12",
                    action: "issue_status",
                    message_id: messageId,
                    timestamp: new Date().toISOString(),
                    version: "2.0.0",
                    bap_id: issue.requestDetails.payload.context.bap_id,
                    bap_uri: issue.requestDetails.payload.context.bap_uri,
                    bpp_id: issue.requestDetails.payload.context.bpp_id,
                    bpp_uri: issue.requestDetails.payload.context.bpp_uri,
                    transaction_id: issue.transactionId
                },
                message: {
                    issue_id: issueId
                }
            };
    
            // Create issue status record
            await IssueStatus.create({
                transactionId: issue.transactionId,
                messageId,
                issueId,
                status: 'PENDING',
                requestDetails: {
                    payload: statusPayload,
                    timestamp: new Date()
                }
            });
    
            // Send status request
            const statusResponse = await IssueService.checkIssueStatus(statusPayload);
    
            // Update issue status record
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
                message: 'Issue status check completed',
                response: statusResponse
            });
    
        } catch (error) {
            console.error('Issue status check failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async getIssueStatus(req, res) {
        try {
            const { userId } = req.body;
    
            // Fetch all transactions for the user
            const transactions = await Transaction.find({ user: userId });
    
            if (!transactions.length) {
                return res.status(404).json({
                    message: "No transactions found for this user"
                });
            }
    
            // Extract transactionIds
            const transactionIds = transactions.map(transaction => transaction.transactionId);
    
            // Find issues for these transactions
            const issues = await Issue.find({
                transactionId: { $in: transactionIds }
            });
    
            if (!issues.length) {
                return res.status(404).json({
                    message: "No issues found for this user's transactions"
                });
            }
    
            // Format the response
            const formattedIssues = issues.map(issue => {
                if (!issue.issueResponse) {
                    // Basic response when no issueResponse exists
                    return {
                        transactionId: issue.transactionId,
                        issueId: issue.issueId,
                        category: issue.category,
                        sub_category: issue.sub_category,
                        status: 'PROCESSING',
                        createdAt: issue.createdAt,
                        updatedAt: issue.updatedAt
                    };
                } else {
                    // Full response when issueResponse exists
                    const issueResponse = issue.issueResponse;
                    return {
                        transactionId: issue.transactionId,
                        issueId: issue.issueId,
                        status: 'RESPONDED',
                        createdAt: issue.createdAt,
                        response: issueResponse
                    };
                }
            });
    
            res.status(200).json({
                message: 'Issue status request processed',
                totalIssues: formattedIssues.length,
                issues: formattedIssues
            });
    
        } catch (error) {
            console.error('Issue status check failed:', error);
            res.status(500).json({ error: error.message });
        }
    }static async getIssueDetails(req, res) {
        try {
            const { issueId } = req.params;
    
            const issue = await Issue.findOne({ issueId });
            if (!issue) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Issue not found' 
                });
            }
    
            // Format response
            const response = {
                issueId: issue.issueId,
                response: issue.issueResponse,
            };
    
            res.status(200).json({
                success: true,
                data: response
            });
    
        } catch (error) {
            console.error('Get issue details failed:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
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
    
            // Update Issue document with just the response
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        issueResponse: req.body,
                        updatedAt: new Date(message.issue.updated_at)
                    }
                }
            );
    
            res.status(200).json({
                message: 'Issue status updated successfully'
            });
    
        } catch (error) {
            console.error('Issue status update failed:', error);
            res.status(500).json({ 
                error: error.message 
            });
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