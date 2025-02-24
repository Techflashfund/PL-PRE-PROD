const SelectThree = require('../models/selectThree.model');

class KycController {
    static async getKycForm(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }

            const selectThree = await SelectThree.findOne({ 
                transactionId,
                kycformurl: { $exists: true }
            });

            if (!selectThree) {
                return res.status(404).json({ error: 'KYC form not found' });
            }

            res.status(200).json({
                formUrl: selectThree.kycformurl,
                formId: selectThree.formId
            });

        } catch (error) {
            console.error('Error fetching KYC form:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = KycController;