const BankDetails = require('../models/bankdetails.model');

class BankController {
    static async submitBankDetails(req, res) {
        try {
            const { userId, accountHolderName, accountType, accountNumber, ifscCode } = req.body;

            if (!userId || !accountHolderName || !accountType || !accountNumber || !ifscCode) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }

            const bankDetails = await BankDetails.create({
                user: userId,
                accountHolderName,
                accountType,
                accountNumber,
                ifscCode
            });

            res.status(200).json({
                message: 'Bank details saved successfully',
                bankDetails
            });

        } catch (error) {
            console.error('Bank details submission failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = BankController;