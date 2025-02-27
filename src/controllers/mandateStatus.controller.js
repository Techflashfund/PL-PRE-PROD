const EMandate = require('../models/mandate.model');

class MandateStatusController {
    static async getMandateStatus(req, res) {
        try {
            const { transactionId, formId } = req.body;

            if (!transactionId || !formId) {
                return res.status(400).json({ 
                    error: 'Transaction ID and Form ID are required' 
                });
            }

            const mandateStatus = await EMandate.findOne({ 
                transactionId,
                formId
            });

            if (!mandateStatus) {
                return res.status(404).json({ 
                    error: 'Mandate record not found' 
                });
            }

            res.status(200).json({
                mandateStatus: mandateStatus.mandateStatus === 'APPROVED' ? 'SUCCESS' : mandateStatus.mandateStatus,
                submissionId: mandateStatus.submissionId,
                formId: mandateStatus.formId,
                formUrl: mandateStatus.formUrl,
                transactionId: mandateStatus.transactionId,
                providerId: mandateStatus.providerId
            });

        } catch (error) {
            console.error('Error fetching mandate status:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = MandateStatusController;