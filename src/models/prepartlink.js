const mongoose = require('mongoose');

const prePartPaymentLinksSchema = new mongoose.Schema({
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
    Response: {
        type: Object,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('PrePartPaymentLinks', prePartPaymentLinksSchema);