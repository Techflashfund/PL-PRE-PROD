const mongoose = require('mongoose');
const SelectTwo = mongoose.model('SelectTwo');
const FormSubmissionServicetwo = require('../services/formsubmissiontwo.services');

class AmountController {
    static async submitAmount(req, res) {
        try {
            console.log('Amount submission request:', req.body);
            const { amount, bppId, transactionId, userId } = req.body;

            // Validate required fields
            if (!amount || !bppId || !transactionId || !userId) {
                return res.status(400).json({ 
                    error: 'Missing required fields: amount, bppId, transactionId, userId' 
                });
            }

            // Validate amount is a positive number
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ 
                    error: 'Amount must be a positive number' 
                });
            }

            const selectTwo = await SelectTwo.findOne({
                transactionId,
                'onselectRequest.context.bpp_id': bppId
            });

            if (!selectTwo) {
                return res.status(404).json({ error: 'Select response not found' });
            }

            const formUrl = selectTwo.amountformurl;
            const formId = selectTwo.formId;
            
            if (!formUrl || !formId) {
                return res.status(404).json({ error: 'Form details not found' });
            }

            const formResponse = await FormSubmissionServicetwo.submitAmountForm(
                formUrl,
                {
                    amount,
                    formId,
                    userId,
                    transactionId
                }
            );

            return res.status(200).json({
                message: 'Amount submitted successfully',
                formResponse
            });

        } catch (error) {
            console.error('Amount submission failed:', error);
            return res.status(500).json({ 
                error: error.message,
                details: error.response?.data || 'No additional details'
            });
        }
    }
}

module.exports = AmountController;