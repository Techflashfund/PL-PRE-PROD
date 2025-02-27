const mongoose = require('mongoose');

const foreclosureLinksSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    orderId: String,
    paymentUrl: String,
    paymentDetails: {
        amount: String,
        currency: String,
        status: String
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ForeclosureLinks', foreclosureLinksSchema);