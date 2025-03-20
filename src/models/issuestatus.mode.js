const mongoose = require('mongoose');

const issueStatusSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    issueId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING'
    },
    requestDetails: {
        payload: Object,
        timestamp: Date
    },
    resolution: {
        payload: Object,
        timestamp: Date
    },
    responseDetails: {
        payload: Object,
        timestamp: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IssueStatus', issueStatusSchema);