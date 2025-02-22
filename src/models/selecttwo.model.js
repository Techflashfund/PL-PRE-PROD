const mongoose = require('mongoose');

const selectTwoSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    selectPayload: Object,
    selectResponse: Object,
    onselectRequest: Object,
    amountformurl: String,
    formId: String,
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    loanOffer: {
        amount: {
            value: String,
            currency: String
        },
        interestRate: String,
        term: String,
        interestRateType: String,
        fees: {
            application: String,
            foreclosure: String,
            interestRateConversion: String,
            delayPenalty: String,
            otherPenalty: String
        },
        annualPercentageRate: String,
        repayment: {
            frequency: String,
            installments: String,
            amount: String
        },
        quote: {
            id: String,
            principal: String,
            interest: String,
            processingFee: String,
            upfrontCharges: String,
            insuranceCharges: String,
            netDisbursedAmount: String,
            otherCharges: String,
            ttl: String
        },
        documents: {
            tncLink: String
        },
        coolOffPeriod: String
    }}
, {
    timestamps: true
});

module.exports = mongoose.models.SelectTwo || mongoose.model('SelectTwo', selectTwoSchema);