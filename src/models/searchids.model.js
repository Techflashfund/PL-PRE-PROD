const mongoose = require('mongoose');

const searchIdsSchema = new mongoose.Schema({
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
        default: 'SEARCH'
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SearchIds', searchIdsSchema);