const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    transactionId: String,
    providerId: String,
    bppId: String,
    formId: String,
    formResponse: {
        status: String,
        submission_id: String
    },
    loanDetails: {
        amount: String,
        term: String,
        interestRate: String,
        installmentAmount: String
    },
    paymentSchedule: [{
        installmentId: String,
        amount: String,
        dueDate: Date,
        status: String
    }],
    statusResponse: Object
}, { timestamps: true });

module.exports = mongoose.model('Status', statusSchema);