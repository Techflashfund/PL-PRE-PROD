const mongoose = require('mongoose');

const disbursedLoanSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    loanDetails: {
        amount: String,
        currency: String,
        interestRate: String,
        term: String,
        repaymentFrequency: String,
        totalInstallments: String
    },
    status: {
        type: String
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
    disbursementDate: {
        type: Date,
        default: Date.now
    },
    Response: {
        type: Object,
        required: true
    }
    
}, {
    timestamps: true
});

module.exports = mongoose.model('DisbursedLoan', disbursedLoanSchema);