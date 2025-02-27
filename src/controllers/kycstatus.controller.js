    const SelectThree = require('../models/selectThree.model');
    const KycStatus = require('../models/kyc.model');


    class KycStatusController {
        static async getKycStatus(req, res) {
            try {
                const { transactionId,formId } = req.body;

                if (!transactionId || !formId) {
                    return res.status(400).json({ 
                        error: 'Transaction ID and Form ID are required' 
                    });
                }

                const kycStatus = await KycStatus.findOne({ 
                    transactionId,
                    formId
                });

                if (!kycStatus) {
                    return res.status(404).json({ 
                        error: 'KYC record not found' 
                    });
                }

                res.status(200).json({
                    kycStatus: kycStatus.kycStatus === 'APPROVED' ? 'SUCCESS' : kycStatus.kycStatus,
                    submissionId: kycStatus.submissionId,
                    formId: kycStatus.formId,
                    transactionId: kycStatus.transactionId,
                    providerId: kycStatus.providerId
                });

            } catch (error) {
                console.error('Error fetching KYC status:', error);
                res.status(500).json({ error: error.message });
            }
        }
    }

    module.exports = KycStatusController;