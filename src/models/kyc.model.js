const mongoose = require('mongoose');

const kycStatusSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    formUrl: String,
    formId: String,
    kycStatus: String,
    submissionId: String,
    statusResponse: Object,
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('KycStatus', kycStatusSchema);