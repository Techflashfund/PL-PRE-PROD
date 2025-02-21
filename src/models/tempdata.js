const mongoose = require('mongoose');

const tempDataSchema = new mongoose.Schema({
    transactionId: String,
    messageId: String,
    action: {
        type: String,
        enum: ['search', 'select', 'init', 'confirm'],
        required: true
    },
    version: String,
    requestData: Object,
    responseData: Object,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TempData', tempDataSchema);