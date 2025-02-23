const Update = require('../models/update.model'); // Import the Update model
class UpdateController{
    static async update(req,res){
        return null
    }


static async onupdate(req, res) {
    try {
        // Extracting relevant data from req.body
        const context = req.body.context;
        const message = req.body.message;

        // Get the update status or fulfillment state code (e.g., SANCTIONED, DISBURSED)
        const fulfillmentState = message.fulfillments && message.fulfillments[0]
            ? message.fulfillments[0].state.descriptor.code
            : 'UNKNOWN'; // Default to 'UNKNOWN' if no fulfillment state is provided

        // Create an update data object
        const updateData = {
            transactionId: context.transaction_id,
            providerId: message.order.provider.id,
            updatePayload: req.body, // Save the whole request body as updatePayload
            updateResponse: {
                messageId: context.message_id,
                timestamp: context.timestamp,
            },
            status: fulfillmentState, // setting status to the fulfillment state code
            updateId: message.order.id, // Order ID from the message
            updateTimestamp: new Date(), // Current date when update is created
        };

        // Create a new Update document
        const update = new Update(updateData);

        // Save to the database
        await update.save();

        // Respond with success
        res.status(200).json({ message: 'Update saved successfully', update });
    } catch (error) {
        console.error('Error saving update:', error);
        res.status(500).json({ message: 'Error saving update', error: error.message });
    }
}

}

module.exports=UpdateController