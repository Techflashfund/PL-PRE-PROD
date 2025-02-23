const { v4: uuidv4 } = require('uuid');

class InitRequestUtils {
    static async createInitOnePayload(selectThree) {
        return {
            context: {
                domain: "ONDC:FIS12",
                location: {
                    country: { code: "IND" },
                    city: { code: "*" }
                },
                version: "2.0.0",
                action: "init",
                bap_uri: selectThree.onselectRequest.context.bap_uri,
                bap_id: selectThree.onselectRequest.context.bap_id,
                bpp_id: selectThree.onselectRequest.context.bpp_id,
                bpp_uri: selectThree.onselectRequest.context.bpp_uri,
                transaction_id: selectThree.transactionId,
                message_id: uuidv4(),
                ttl: "PT10M",
                timestamp: new Date().toISOString()
            },
            message: {
                order: {
                    provider: {
                        id: selectThree.providerId
                    },
                    items: [
                        {
                            id: selectThree.onselectRequest.message.order.items[0].id,
                            xinput: {
                                form: {
                                    id:selectThree.formId
                                },
                                form_response: {
                                    status: "SUCCESS",
                                    submission_id: selectThree.kycSubmissionId
                                }
                            }
                        }
                    ],
                    payments: [
                        {
                            collected_by: "BPP",
                            type: "ON_ORDER",
                            status: "NOT-PAID",
                            params: {
                                bank_code: "XXXXXXXX",
                                bank_account_number: "xxxxxxxxxxxxxx",
                                virtual_payment_address: "9988199772@okicic"
                            },
                            tags: [
                                {
                                    descriptor: {
                                        code: "BUYER_FINDER_FEES"
                                    },
                                    display: false,
                                    list: [
                                        {
                                            descriptor: {
                                                code: "BUYER_FINDER_FEES_TYPE"
                                            },
                                            value: "percent-annualized"
                                        },
                                        {
                                            descriptor: {
                                                code: "BUYER_FINDER_FEES_PERCENTAGE"
                                            },
                                            value: "1"
                                        }
                                    ]
                                },
                                {
                                    descriptor: {
                                        code: "SETTLEMENT_TERMS"
                                    },
                                    display: false,
                                    list: [
                                        {
                                            descriptor: {
                                                code: "SETTLEMENT_AMOUNT"
                                            },
                                            value: "1159"
                                        },
                                        {
                                            descriptor: {
                                                code: "SETTLEMENT_TYPE"
                                            },
                                            value: "neft"
                                        },
                                        {
                                            descriptor: {
                                                code: "DELAY_INTEREST"
                                            },
                                            value: "5"
                                        },
                                        {
                                            descriptor: {
                                                code: "STATIC_TERMS"
                                            },
                                            value: "https://bap.credit.becknprotocol.io/personal-banking/loans/personal-loan"
                                        },
                                        {
                                            descriptor: {
                                                code: "OFFLINE_CONTRACT"
                                            },
                                            value: "true"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        };
    }
}

module.exports = InitRequestUtils;