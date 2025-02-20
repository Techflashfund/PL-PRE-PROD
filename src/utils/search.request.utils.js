const generateSearchRequestBody = ({ transactionId, messageId }) => {
    return {
        context: {
            domain: "ONDC:FIS12",
            location: {
                country: { code: "IND" },
                city: { code: "*" }
            },
            action: "search",
            version: "2.0.0",
            bap_uri: "https://pl.pr.flashfund.in/",
            bap_id: "pl.pr.flashfund.in",
            ttl: "PT10M",
            timestamp: new Date().toISOString(),
            transaction_id: transactionId,
            message_id: messageId
        },
        message: {
            intent: {
                category: {
                    descriptor: { code: "PERSONAL_LOAN" }
                },
                payment: {
                    collected_by: "BPP66",
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
                                    descriptor: { code: "DELAY_INTEREST" },
                                    value: "2.5"
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
                }
            }
        }
    };
};

module.exports = { generateSearchRequestBody };