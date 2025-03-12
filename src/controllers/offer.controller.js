const SelectTwo = require('../models/selecttwo.model');

class OffersController {
    static async getOffers(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }

            const selectTwoRecords = await SelectTwo.find({ transactionId });

            if (!selectTwoRecords.length) {
                return res.status(404).json({ error: 'No offers found' });
            }
            const validRecords = selectTwoRecords.filter(record => record.onselectRequest);

            if (!validRecords.length) {
                return res.status(404).json({ error: 'No valid offers found' });
            }

            const offers = validRecords.map(record => ({
                lenderId: record.onselectRequest.message.order.provider.id,
                lenderName: record.onselectRequest.message.order.provider.descriptor.name,
                loanAmount: record.loanOffer.amount.value,
                interestRate: record.loanOffer.interestRate,
                term: record.loanOffer.term,
                installmentAmount: record.loanOffer.repayment.amount,
                processingFee: record.loanOffer.fees.application,
                foreclosureFee: record.loanOffer.fees.foreclosure,
                annualPercentageRate: record.loanOffer.annualPercentageRate,
                lenderlogo:record.onselectRequest.message.order.provider.descriptor.images.url
            }));

            res.status(200).json(offers);

        } catch (error) {
            console.error('Error fetching offers:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = OffersController;