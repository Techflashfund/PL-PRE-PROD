const { v4: uuidv4 } = require('uuid');
const IssueMessageIds = require('../models/issuemessageids.model');

class IssueRequestUtils {
    static async createIssuePayload(disbursedLoan, issueDetails) {
        const messageId = uuidv4();
        const issueId = uuidv4();

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
                location: {
                    country: {
                        code: "IND"
                    },
                    city: {
                        code: "*"
                    }
                },
                action: "issue",
                version: "2.0.0",
                bap_id: disbursedLoan.context.bap_id,
                bap_uri: disbursedLoan.context.bap_uri,
                bpp_uri: disbursedLoan.context.bpp_uri,
                bpp_id: disbursedLoan.context.bpp_id,
                transaction_id: issueDetails.transactionId,
                message_id: messageId,
                timestamp: new Date().toISOString(),
                ttl: "PT30S"
            },
            message: {
                issue: {
                    id: issueId,
                    category: issueDetails.category || "FULFILMENT",
                    sub_category: issueDetails.sub_category || "FLM01",
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
                        state: disbursedLoan.message.order.fulfillments?.[0]?.state?.descriptor?.code || "UNKNOWN",
                        provider_id: disbursedLoan.providerId
                    },
                    description: {
                        short_desc: issueDetails.shortDesc,
                        Long_desc: issueDetails.longDesc,
                        additional_desc: {
                            url: "",
                            content_type: "text/plain"
                        },
                        images: []
                    },
                    source: {
                        network_participant_id: `${disbursedLoan.context.bap_id}/ondc`,
                        type: "CONSUMER"
                    },
                    expected_response_time: {
                        duration: "PT2H"
                    },
                    expected_resolution_time: {
                        duration: "P1D"
                    },
                    status: "OPEN",
                    issue_type: "ISSUE",
                    issue_actions: {
                        complainant_actions: [
                            {
                                complainant_action: "OPEN",
                                short_desc: "Complaint created",
                                updated_at: new Date().toISOString(),
                                updated_by: {
                                    org: {
                                        name: `${disbursedLoan.context.bap_id}::ONDC:FIS12`
                                    },
                                    contact: {
                                        phone: '9879879879',
                                        email: 'info@flashfund.in'
                                    }
                                }
                            }
                        ]
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            }
        };
    }
}

module.exports = IssueRequestUtils;