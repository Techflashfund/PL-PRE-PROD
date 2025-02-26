const mongoose = require('mongoose');

const confirmSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    confirmPayload: Object,
    confirmResponse: Object,
    status: String,
    confirmationId: String,
    loanDetails: {
        amount: String,
        currency: String,
        interestRate: String,
        term: String,
        interestRateType: String,
        applicationFee: String,
        foreclosureFee: String,
        installmentAmount: String,
        repaymentFrequency: String,
        numberOfInstallments: String
    },
    breakdown: {
        principal: String,
        interest: String,
        processingFee: String,
        insuranceCharges: String,
        netDisbursedAmount: String,
        otherCharges: String
    },
    customerDetails: {
        name: String,
        phone: String,
        email: String
    },
    paymentSchedule: [{
        installmentId: String,
        amount: String,
        startDate: Date,
        endDate: Date,
        status: String
    }],
    documents: [{
        code: String,
        name: String,
        description: String,
        url: String,
        mimeType: String
    }],
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Confirm', confirmSchema);