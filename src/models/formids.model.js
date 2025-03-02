const mongoose = require('mongoose');

const formIdsSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    formId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['KYC', 'MANDATE', 'DOCUMENT'],
        required: true
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FormIds', formIdsSchema);