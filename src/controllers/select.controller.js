const Transaction = require('../models/transaction.model');
const SelectRequestHandler = require('../services/select.services');
const TempData = require('../models/tempdata');

class SelectController {
    static async makeSelect(req, res) {
        try {
            const { transactionId, submissionId } = req.body;

            const transaction = await Transaction.findOne({ transactionId })
                .populate('formDetails');

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            const selectPayload = SelectRequestHandler.createSelectPayload(
                transaction.ondcResponse, 
                submissionId
            );

            const selectResponse = await SelectRequestHandler.makeSelectRequest(selectPayload);

            await Transaction.findByIdAndUpdate(transaction._id, {
                status: 'SELECT_INITIATED',
                selectPayload,
                selectRequestTimestamp: new Date()
            });

            res.status(200).json({
                message: 'Select request initiated successfully',
                selectResponse
            });

        } catch (error) {
            console.error('Select request failed:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async onSelect(req, res) {

        console.log('reqqqqqqqqqqqqqq');    
        
        try {
            const version = req.body.context?.version;
  if (version !== "2.0.0") {
    return res.status(400).json({ error: "Unsupported version" });
  }

            const { context, message } = req.body;
            await TempData.create({
                transactionId: context.transaction_id,
                messageId: context.message_id,
                action: 'select',
                version: version,
                requestData: req.body,
                timestamp: new Date()
            });

            console.log('On Select Response:', { context, message });
            
            if (!context?.transaction_id || !message) {
                return res.status(400).json({ error: 'Invalid select response format' });
            }

            const transaction = await Transaction.findOne({ 
                transactionId: context.transaction_id,
                'selectoneResponse.providerId': message.order.provider.id 
            });

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            // Update select response for specific provider
            await Transaction.findOneAndUpdate(
                { 
                    transactionId: context.transaction_id,
                    'selectoneResponse.providerId': message.order.provider.id
                },
                {
                    $set: {
                        'selectoneResponse.$.response': req.body,
                        'selectoneResponse.$.status': 'COMPLETED',
                        'selectoneResponse.$.responseTimestamp': new Date(),
                        status: 'SELECTONE_COMPLETED'
                    }
                }
            );

            res.status(200).json({
                message: 'Select response processed successfully',
                transactionId: context.transaction_id,
                providerId: message.order.provider.id
            });

        } catch (error) {
            console.error('Select response processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = SelectController;