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
        shortDesc: String,
        longDesc: String,
        actionTriggered: String,
        refundAmount: String
    },
    responseDetails: {
        payload: Object,
        timestamp: Date,
        respondentActions: [{
            respondentAction: String,
            shortDesc: String,
            updatedAt: Date,
            updatedBy: {
                org: {
                    name: String
                },
                contact: {
                    phone: String,
                    email: String
                },
                person: {
                    name: String
                }
            },
            cascadedLevel: Number
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IssueStatus', issueStatusSchema);