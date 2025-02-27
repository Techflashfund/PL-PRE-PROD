const mongoose = require('mongoose');

const sanctionedLoanSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    providerId: String,
    loanDetails: {
        amount: String,
        currency: String,
        interestRate: String,
        term: String,
        repaymentFrequency: String,
        numberOfInstallments: String,
        installmentAmount: String
    },
    breakdown: {
        principal: String,
        interest: String,
        processingFee: String,
        insuranceCharges: String,
        netDisbursedAmount: String,
        outstandingPrincipal: String,
        outstandingInterest: String
    },
    customerDetails: {
        name: String,
        phone: String,
        email: String
    },
    paymentSchedule: [{
        installmentId: String,
        amount: String,
        currency: String,
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
    status: {
        type: String
    
    },
    sanctionDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SanctionedLoan', sanctionedLoanSchema);