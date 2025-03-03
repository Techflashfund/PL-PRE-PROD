const mongoose = require('mongoose');

const missedEmiSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DisbursedLoan'
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
    initiatedBy: String
}, {
    timestamps: true
});

module.exports = mongoose.model('MissedEmi', missedEmiSchema);