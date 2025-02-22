const mongoose = require('mongoose');

const tempDataSchema = new mongoose.Schema({
    transactionId: String,
    messageId: String,
    action: {
        type: String,
        default: 'on_select'
    },
    payloadType: String,
    responseData: Object,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TempData', tempDataSchema);