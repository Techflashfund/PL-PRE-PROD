const mongoose = require('mongoose');

const noFormStatusSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    statusPayload: {
        type: Object,
        required: true
    },
    responseTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('NoFormStatus', noFormStatusSchema);