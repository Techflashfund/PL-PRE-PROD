const mongoose = require('mongoose');

const initMessageIdsSchema = new mongoose.Schema({
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
        enum: ['INIT_1', 'INIT_2', 'INIT_3'],
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

module.exports = mongoose.model('InitMessageIds', initMessageIdsSchema);