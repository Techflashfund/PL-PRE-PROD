const mongoose = require('mongoose');

const foreclosureSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DisbursedLoan'
    },
    status: {
        type: String,
        enum: ['INITIATED', 'APPROVED', 'REJECTED', 'COMPLETED'],
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
    foreclosureAmount: {
        principal: String,
        interest: String,
        charges: String,
        total: String,
        currency: String
    },
    initiatedBy: String,
    approvedBy: String,
    remarks: String,
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Foreclosure', foreclosureSchema);