const InitMessageIds = require('../models/initmessage.model');

const getInitPayloadType = async (payload) => {
    const initIdRecord = await InitMessageIds.findOne({
        messageId: payload.context.message_id
    });

    if (initIdRecord) {
        // Update status to yes
        await InitMessageIds.findOneAndUpdate(
            { messageId: payload.context.message_id },
            { status: 'yes' }
        );

        // Return type based on init type
        switch(initIdRecord.type) {
            case 'INIT_1':
                return "TypeOne";
            case 'INIT_2':
                return "TypeTwo";
            case 'INIT_3':
                return "TypeThree";
        }
    }

    // Fallback to original logic
    if (payload.message?.order?.items?.[0]?.xinput?.head?.index?.cur === 0) {
        return "TypeOne";
    } else if (payload.message?.order?.items?.[0]?.xinput?.head?.index?.cur === 1) {
        return "TypeTwo";
    } else if (payload.message?.order?.items?.[0]?.xinput?.head?.index?.cur === 2) {
        return "TypeThree";
    }

    return null;
};

module.exports = {
    getInitPayloadType
};