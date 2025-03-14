const { v4: uuidv4 } = require('uuid');
const IssueMessageIds = require('../models/issuemessageids.model');
class IssueRequestUtils {
    static async createIssuePayload(disbursedLoan, issueDetails) {
        const messageId = uuidv4();
        const issueId = uuidv4();
        console.log('veer',disbursedLoan.transaction_id);
        

        await IssueMessageIds.create({
            transactionId: issueDetails.transactionId,
            messageId: messageId,
            issueId: issueId,
            type: 'ISSUE',
            status: 'no'
        });
        
        return {
            context: {
                domain: "ONDC:FIS12",
                country: "IND",
                city: "std:0522",
                action: "issue",
                core_version: "1.0.0",
                bap_id: disbursedLoan.context.bap_id,
                bap_uri: disbursedLoan.context.bap_uri,
                bpp_uri: disbursedLoan.context.bpp_uri,
                transaction_id: issueDetails.transactionId,
                message_id: messageId,
                timestamp: new Date().toISOString(),
                bpp_id: disbursedLoan.context.bpp_id,
                ttl: "PT30S"
            },
            message: {
                issue: {
                    id: issueId,
                    complainant_info: {
                        person: {
                            name: issueDetails.name
                        },
                        contact: {
                            phone: issueDetails.phone,
                            email: issueDetails.email
                        }
                    },
                    order_details: {
                        id: disbursedLoan.message.order.id,
                        state: "Completed",
                        provider_id: disbursedLoan.providerId
                    },
                    description: {
                        short_desc: issueDetails.shortDesc,
                        long_desc: issueDetails.longDesc
                    },
                    category: "LOAN",
                    issue_type: "ISSUE",
                    source: {
                        network_participant_id: disbursedLoan.context.bap_id,
                        type: "CONSUMER"
                    },
                    expected_response_time: {
                        duration: "PT2H"
                    },
                    expected_resolution_time: {
                        duration: "P1D"
                    },
                    status: "OPEN",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            }
        };
    }
}

module.exports = IssueRequestUtils;