const mongoose = require('mongoose');

const selectIdsSchema = new mongoose.Schema({
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
        default: 'SELECT_1'
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SelectIds', selectIdsSchema);