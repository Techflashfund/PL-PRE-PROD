const mongoose = require('mongoose');

const selectOneSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    providerId: String,
    selectPayload: Object,
    selectResponse: Object,
    onselectRequest: Object,
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SelectOne', selectOneSchema);