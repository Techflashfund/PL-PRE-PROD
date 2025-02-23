const InitThree = require('../models/initthree.model');
const Transaction=require('../models/transaction.model')
const Confirm=require('../models/confirm.model')
const ConfirmPayloadHandler = require('../utils/confirm.utils');
const ConfirmService = require('../services/confirm.services');

class ConfirmController {
    static async confirm(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }

            const initThree = await InitThree.findOne({ transactionId });

            if (!initThree) {
                return res.status(404).json({ error: 'Init three record not found' });
            }

            if (initThree.documentStatus !== 'APPROVED') {
                return res.status(400).json({ error: 'Document not approved yet' });
            }

            const confirmPayload = ConfirmPayloadHandler.createConfirmPayload(initThree);
            const confirmResponse = await ConfirmService.makeConfirmRequest(confirmPayload);

            await Transaction.findOneAndUpdate(
                { transactionId },
                { status: 'CONFIRM_INITIATED' }
            );

            res.status(200).json({
                message: 'Confirm request initiated successfully',
                confirmResponse
            });

        } catch (error) {
            console.error('Confirm request failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async onconfirm(req, res) {
        try {
            // Extracting relevant data from req.body
            const context = req.body.context;
            const message = req.body.message;
    
            // Get the fulfillment state code (e.g., SANCTIONED)
            const fulfillmentState = message.fulfillments && message.fulfillments[0]
                ? message.fulfillments[0].state.descriptor.code
                : 'UNKNOWN'; // Default to 'UNKNOWN' if no fulfillment state is provided
    
            // Constructing the confirm data
            const confirmData = {
                transactionId: context.transaction_id, // transaction_id from context
                providerId: message.order.provider.id, // provider id from message
                confirmPayload: req.body, // you can save the whole request body as confirmPayload
                confirmResponse: {
                    messageId: context.message_id,
                    timestamp: context.timestamp,
                },
                status: fulfillmentState, // setting status to the fulfillment state code
                confirmationId: message.order.id, // order id from message
                confirmationTimestamp: new Date(), // current date when confirmation is created
            };
    
            // Create a new Confirm document
            const confirm = new Confirm(confirmData);
    
            // Save to the database
            await confirm.save();
    
            // Respond with success
            res.status(200).json({ message: 'Confirmation saved successfully', confirm });
        } catch (error) {
            console.error('Error saving confirmation:', error);
            res.status(500).json({ message: 'Error saving confirmation', error: error.message });
        }
    }
    
}

module.exports = ConfirmController;