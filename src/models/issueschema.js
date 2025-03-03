const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    issueId: {
        type: String,
        required: true
    },
    complainantInfo: {
        name: String,
        phone: String,
        email: String
    },
    description: {
        shortDesc: String,
        longDesc: String
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    requestDetails: {
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

module.exports = mongoose.model('Issue', issueSchema);