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
}

module.exports = SelectPayloadHandler;