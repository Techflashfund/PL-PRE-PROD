const mongoose = require('mongoose');

const completedLoanSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    providerId: String,
    loanDetails: {
        amount: String,
        currency: String,
        term: String,
        interestRate: String
    },
    completionDate: {
        type: Date,
        default: Date.now
    },
    Response: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('CompletedLoan', completedLoanSchema);