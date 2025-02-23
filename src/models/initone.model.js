const mongoose = require('mongoose');

const initOneSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    initPayload: Object,
    initResponse: Object,
    initonerequest:Object,
    bankformurl:String,
    bankformId:String,
    bankdetailsSubmissionId:String,
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    kycSubmissionId: String,
    responseTimestamp: Date
}, {
    timestamps: true
});

module.exports = mongoose.models.InitOne || mongoose.model('InitOne', initOneSchema);