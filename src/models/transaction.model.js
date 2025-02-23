
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
        enum: ['PENDING', 'COMPLETED', 'FAILED','FORM_SUBMITTED','SELECTONE_INITIATED','SELECTONE_COMPLETED','SELECTTWO_INITIATED','SELECTWO_COMPLETED','SELECTHREE_INITIATED','SELECTHREE_COMPLETED','INITONE_INITIATED','INITONE_COMPLETED','INITTWO_INITIATED','INITTWO_COMPLETED','INITTHREE_INITIATED','INITTHREE_COMPLETED'],
        default: 'PENDING'
    },
    formDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FormDetails'
    },
    requestBody: Object,

    ondcSearchResponses: [{
        response: Object,
        providerId: String,
        providerName: String,
        formDetails: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FormDetails'
        },
        formSubmissionId: String,
        responseTimestamp: {
            type: Date,
            default: Date.now
        }
    }]
    
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);