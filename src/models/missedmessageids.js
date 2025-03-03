const mongoose = require('mongoose');

const missedEmiMessageIdsSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'MISSED_EMI'
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MissedEmiMessageIds', missedEmiMessageIdsSchema);