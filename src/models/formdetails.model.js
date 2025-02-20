const mongoose = require('mongoose');

const formDetailsSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    formId: {
        type: String,
        required: true
    },
    formUrl: {
        type: String,
        required: true
    },
    mimeType: String,
    resubmit: {
        type: Boolean,
        default: false
    },
    multipleSubmissions: {
        type: Boolean,
        default: false
    },
    providerName: String,
    providerDescription: String,
    minLoanAmount: String,
    maxLoanAmount: String,
    minInterestRate: String,
    maxInterestRate: String,
    minTenure: String,
    maxTenure: String
}, {
    timestamps: true
});

module.exports = mongoose.model('FormDetails', formDetailsSchema);