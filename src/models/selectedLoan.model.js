const mongoose = require('mongoose');

const selectedLoanSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    requestedAmount: {
        type: Number,
        required: true
    },
    sanctionedAmount: {
        type: Number,
        required: true
    },
    lenderId: String,
    lenderName: String,
    submissionId: String,
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SelectedLoan || mongoose.model('SelectedLoan', selectedLoanSchema);