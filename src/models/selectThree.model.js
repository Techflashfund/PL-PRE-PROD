const mongoose = require('mongoose');

const selectThreeSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    selectPayload: Object,
    selectResponse: Object,
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    kycStatus: {
        type: String
    },
    kycSubmissionId: String,
    submissionId: String,
    requestedAmount: Number,
    responseTimestamp: Date,
    onselectRequest: Object,
    kycformurl: String,
    formId: String,
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SelectThree || mongoose.model('SelectThree', selectThreeSchema);