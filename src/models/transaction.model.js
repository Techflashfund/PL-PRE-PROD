
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
        type: String

        
    },
    amount:{type:String},
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