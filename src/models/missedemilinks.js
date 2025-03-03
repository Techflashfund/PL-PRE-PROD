const mongoose = require('mongoose');

const missedEmiLinksSchema = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MissedEmiLinks', missedEmiLinksSchema);