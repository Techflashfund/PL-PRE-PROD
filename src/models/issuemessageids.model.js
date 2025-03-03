const mongoose = require('mongoose');

const issueMessageIdsSchema = new mongoose.Schema({
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
    type: {
        type: String,
        default: 'ISSUE'
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IssueMessageIds', issueMessageIdsSchema);