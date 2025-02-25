const SelectThree = require('../models/selectThree.model');

class KycStatusController {
    static async getKycStatus(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }

            const selectThree = await SelectThree.findOne({ 
                transactionId 
            });

            if (!selectThree) {
                return res.status(404).json({ error: 'KYC record not found' });
            }

            res.status(200).json({
                kycStatus: selectThree.kycStatus,
                kycSubmissionId: selectThree.kycSubmissionId,
                formId: selectThree.formId,
                transactionId: selectThree.transactionId
            });

        } catch (error) {
            console.error('Error fetching KYC status:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = KycStatusController;