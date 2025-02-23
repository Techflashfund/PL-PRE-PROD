const mongoose = require('mongoose');

const initThreeSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    initPayload: {
        type: Object,
        required: true
    },
    initResponse: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    emandateSubmissionId: String,
    documentformurl: String,
    documentformId: String,
    documentSubmissionId: String,
    documentStatus: String,
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.InitThree || mongoose.model('InitThree', initThreeSchema);