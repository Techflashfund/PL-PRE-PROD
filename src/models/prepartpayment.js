const mongoose = require('mongoose');

const prePaymentSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DisbursedLoan'
    },
    amount: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['INITIATED', 'COMPLETED', 'FAILED'],
        default: 'INITIATED'
    },
    requestDetails: {
        payload: Object,
        timestamp: Date
    },
    responseDetails: {
        payload: Object,
        timestamp: Date
    },
    initiatedBy: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('PrePayment', prePaymentSchema);