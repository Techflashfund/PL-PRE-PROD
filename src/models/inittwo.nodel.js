const mongoose = require('mongoose');

const initTwoSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    initPayload: Object,
    initResponse: Object,
    inittworequest: Object,
    emandateformurl: String,
    emandateStatus:String,
    emandateSubmissionId:String,    
    emandateformId: String,
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    bankDetailsSubmissionId: String,
    responseTimestamp: Date
}, {
    timestamps: true
});

module.exports = mongoose.models.InitTwo || mongoose.model('InitTwo', initTwoSchema);