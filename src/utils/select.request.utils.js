const { v4: uuidv4 } = require('uuid');
class SelectPayloadHandler {

static async createSelectonePayload(ondcResponse, formSubmissionId) {
    const selectPayload = {
        context: {
            ...ondcResponse.context,
            action: "select",
            message_id: uuidv4(),
            timestamp: new Date().toISOString()
        },
        message: {
            order: {
                provider: {
                    id: ondcResponse.message.catalog.providers[0].id
                },
                items: [
                    {
                        id: ondcResponse.message.catalog.providers[0].items[0].id,
                        xinput: {
                            form: {
                                id: ondcResponse.message.catalog.providers[0].items[0].xinput.form.id
                            },
                            form_response: {
                                status: "SUCCESS",
                                submission_id: formSubmissionId
                            }
                        }
                    }
                ]
            }
        }
    };
    console.log('Select Payload Created:', JSON.stringify(selectPayload, null, 2));
    return selectPayload;
}

static async createSelecttwoPayload(payload) {
    const context = payload.context;
    const providerId = payload.message?.order?.provider?.id;
    const itemId = payload.message?.order?.items?.[0]?.id;
    const formId = payload.message?.order?.items?.[0]?.xinput?.form?.id;
    const submissionId = payload.message?.order?.items?.[0]?.xinput?.form_response?.submission_id;

    // Create new timestamp
    const newTimestamp = new Date().toISOString();
    
    // Create new message ID
    const newMessageId = uuidv4();

    // Construct new payload
    const selectPayload = {
        context: {
            ...context,  // Spread existing context values
            action: "select", // Override action
            timestamp: newTimestamp,
            message_id: newMessageId,
            ttl: "PT10M"  // Override TTL as specified
        },
        message: {
            order: {
                provider: {
                    id: providerId
                },
                items: [
                    {
                        id: itemId,
                        xinput: {
                            form: {
                                id: formId
                            },
                            form_response: {
                                status: "APPROVED",
                                submission_id: submissionId
                            }
                        }
                    }
                ]
            }
        }
    };
    console.log('SelectTWo Payload Created:', JSON.stringify(selectPayload, null, 2));
    return selectPayload;
}

static async createSelecthreePayload(selectTwo, submissionId){
    return {
        context: {
            domain: "ONDC:FIS12",
            location: {
                country: { code: "IND" },
                city: { code: "*" }
            },
            transaction_id: selectTwo.transactionId,
            message_id: uuidv4(),
            action: "select",
            timestamp: new Date().toISOString(),
            version: "2.0.1",
            bap_uri: selectTwo.onselectRequest.context.bap_uri,
            bap_id: selectTwo.onselectRequest.context.bap_id,
            ttl: "PT10M",
            bpp_id: selectTwo.onselectRequest.context.bpp_id,
            bpp_uri: selectTwo.onselectRequest.context.bpp_uri
        },
        message: {
            order: {
                provider: {
                    id: selectTwo.onselectRequest.message.order.provider.id
                },
                items: [
                    {
                        id: selectTwo.onselectRequest.message.order.items[0].id,
                        xinput: {
                            form: {
                                id: selectTwo.formId
                            },
                            form_response: {
                                status: "SUCCESS",
                                submission_id: submissionId
                            }
                        }
                    }
                ]
            }
        }
    };
}
}

module.exports = SelectPayloadHandler;