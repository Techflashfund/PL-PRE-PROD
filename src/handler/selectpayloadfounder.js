const SelectIds = require('../models/selectids.model');

const getPayloadType = async (payload) => {
    // Check message_id in SelectIds
    const selectIdRecord = await SelectIds.findOne({
        messageId: payload.context.message_id
    });

    if (selectIdRecord) {
        // Update status to yes
        await SelectIds.findOneAndUpdate(
            { messageId: payload.context.message_id },
            { status: 'yes' }
        );

        // Return form type based on select type
        switch(selectIdRecord.type) {
            case 'SELECT_1':
                return "INITIAL_FORM";
            case 'SELECT_2':
                return "LOAN_AMOUNT";
            case 'SELECT_3':
                return "KYC";
        }
    }

   

    return null;
};

module.exports = {
    getPayloadType
};