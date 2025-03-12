const { v4: uuidv4 } = require('uuid');
const InitMessageIds = require('../models/initmessage.model');


class InitRequestUtils {
    static async createInitOnePayload(selectThree,kycSubmissionId) {
        const messageId = uuidv4();

        // Save init message details
        await InitMessageIds.create({
            transactionId: selectThree.transactionId,
            messageId: messageId,
            type: 'INIT_1',
            status: 'no'
        });
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
                message_id: messageId,
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
                                    submission_id: kycSubmissionId
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

    static async createInitTwoPayload(initOne, bankDetailsSubmissionId,formId) {
        const messageId = uuidv4();

        // Save init message details
        await InitMessageIds.create({
            transactionId: initOne.transactionId,
            messageId: messageId,
            type: 'INIT_2',
            status: 'no'
        });
    
        return {
            context: {
                domain: "ONDC:FIS12",
                location: {
                    country: { code: "IND" },
                    city: { code: "*" }
                },
                version: "2.0.1",
                action: "init",
                bap_uri: initOne.initPayload.context.bap_uri,
                bap_id: initOne.initPayload.context.bap_id,
                bpp_id: initOne.initPayload.context.bpp_id,
                bpp_uri: initOne.initPayload.context.bpp_uri,
                transaction_id: initOne.transactionId,
                message_id: messageId,
                ttl: "PT10M",
                timestamp: new Date().toISOString()
            },
            message: {
                order: {
                    provider: {
                        id: initOne.providerId
                    },
                    items: [{
                        id: initOne.initPayload.message.order.items[0].id,
                        xinput: {
                            form: {
                                id: formId
                            },
                            form_response: {
                                status: "SUCCESS",
                                submission_id: bankDetailsSubmissionId
                            }
                        }
                    }],
                    payments: [{
                        id: initOne.initonerequest.message.order.payments[0].id,
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
                                descriptor: { code: "BUYER_FINDER_FEES" },
                                display: false,
                                list: [
                                    {
                                        descriptor: { code: "BUYER_FINDER_FEES_TYPE" },
                                        value: "percent-annualized"
                                    },
                                    {
                                        descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" },
                                        value: "1"
                                    }
                                ]
                            },
                            {
                                descriptor: { code: "SETTLEMENT_TERMS" },
                                display: false,
                                list: [
                                    {
                                        descriptor: { code: "SETTLEMENT_AMOUNT" },
                                        value: "1666.67"
                                    },
                                    {
                                        descriptor: { code: "SETTLEMENT_TYPE" },
                                        value: "neft"
                                    },
                                    {
                                        descriptor: { code: "DELAY_INTEREST" },
                                        value: "5"
                                    },
                                    {
                                        descriptor: { code: "STATIC_TERMS" },
                                        value: "https://bap.credit.becknprotocol.io/personal-banking/loans/personal-loan"
                                    },
                                    {
                                        descriptor: { code: "OFFLINE_CONTRACT" },
                                        value: "true"
                                    }
                                ]
                            }
                        ]
                    }]
                }
            }
        };
    }
    static async createInitThreePayload(initTwo, submissionId,formId) {
        const messageId = uuidv4();

    // Save init message details
    await InitMessageIds.create({
        transactionId: initTwo.transactionId,
        messageId: messageId,
        type: 'INIT_3',
        status: 'no'
    });
        return {
            context: {
                domain: "ONDC:FIS12",
                location: {
                    country: { code: "IND" },
                    city: { code: "*" }
                },
                version: "2.0.1",
                action: "init",
                bap_uri: initTwo.initPayload.context.bap_uri,
                bap_id: initTwo.initPayload.context.bap_id,
                bpp_id: initTwo.initPayload.context.bpp_id,
                bpp_uri: initTwo.initPayload.context.bpp_uri,
                transaction_id: initTwo.transactionId,
                message_id: messageId,
                ttl: "PT10M",
                timestamp: new Date().toISOString()
            },
            message: {
                order: {
                    provider: {
                        id: initTwo.providerId
                    },
                    items: [{
                        id: initTwo.initPayload.message.order.items[0].id,
                        xinput: {
                            form: {
                                id: formId
                            },
                            form_response: {
                                status: "SUCCESS",
                                submission_id: submissionId
                            }
                        }
                    }],
                    payments: [{
                        id: initTwo.inittworequest.message.order.payments[0].id,
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
                                descriptor: { code: "BUYER_FINDER_FEES" },
                                display: false,
                                list: [
                                    {
                                        descriptor: { code: "BUYER_FINDER_FEES_TYPE" },
                                        value: "percent-annualized"
                                    },
                                    {
                                        descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" },
                                        value: "1"
                                    }
                                ]
                            },
                            {
                                descriptor: { code: "SETTLEMENT_TERMS" },
                                display: false,
                                list: [
                                    {
                                        descriptor: { code: "SETTLEMENT_AMOUNT" },
                                        value: "1666.67"
                                    },
                                    {
                                        descriptor: { code: "SETTLEMENT_TYPE" },
                                        value: "neft"
                                    },
                                    {
                                        descriptor: { code: "DELAY_INTEREST" },
                                        value: "5"
                                    },
                                    {
                                        descriptor: { code: "STATIC_TERMS" },
                                        value: "https://bap.credit.becknprotocol.io/personal-banking/loans/personal-loan"
                                    },
                                    {
                                        descriptor: { code: "OFFLINE_CONTRACT" },
                                        value: "true"
                                    }
                                ]
                            }
                        ]
                    }]
                }
            }
        };
    }
}

module.exports = InitRequestUtils;