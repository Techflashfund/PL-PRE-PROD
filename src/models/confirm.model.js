const mongoose = require('mongoose');

const confirmSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    confirmPayload: {
        type: Object,
        required: true
    },
    confirmResponse: {
        type: Object,
        required: true
    },
    status: {
        type: String
    },
    confirmationId: String,
    confirmationTimestamp: {
        type: Date,
        default: Date.now
    },
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Confirm || mongoose.model('Confirm', confirmSchema);
