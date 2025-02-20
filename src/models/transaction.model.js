
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    formSubmissionId:{
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED','FORM_SUBMITTED'],
        default: 'PENDING'
    },
    formDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FormDetails'
    },
    requestBody: Object,
    ondcResponse: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);