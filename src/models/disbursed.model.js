const mongoose = require('mongoose');

const disbursedLoanSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    providerId: String,
    providerDetails: {
        name: String,
        shortDesc: String,
        longDesc: String,
        logo: String,
        contact: {
            groName: String,
            groEmail: String,
            groPhone: String,
            groDesignation: String,
            groAddress: String,
            supportLink: String,
            supportPhone: String,
            supportEmail: String
        },
        lspInfo: {
            name: String,
            email: String,
            phone: String,
            address: String
        }
    },
    loanDetails: {
        amount: String,
        currency: String,
        term: String,
        interestRate: String,
        interestRateType: String,
        applicationFee: String,
        foreclosureFee: String,
        conversionCharge: String,
        delayPenalty: String,
        otherPenalty: String,
        annualPercentageRate: String,
        repaymentFrequency: String,
        numberOfInstallments: String,
        tncLink: String,
        coolOffPeriod: String,
        installmentAmount: String
    },
    breakdown: [{
        title: String,
        amount: String,
        currency: String
    }],
    customer: {
        name: String,
        phone: String,
        email: String
    },
    paymentSchedule: [{
        installmentId: String,
        amount: String,
        currency: String,
        status: String,
        startDate: Date,
        endDate: Date
    }],
    documents: [{
        code: String,
        name: String,
        description: String,
        mimeType: String,
        url: String
    }],
    status: {
        type: String,
        enum: ['DISBURSED', 'COMPLETED', 'FORECLOSED'],
        default: 'DISBURSED'
    },
    Response: {
        type: Object,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DisbursedLoan', disbursedLoanSchema);