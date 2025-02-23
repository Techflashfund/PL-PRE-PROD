const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ['savings', 'current'],
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true,
        match: /^[A-Z]{4}0[A-Z0-9]{6}$/
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BankDetails', bankDetailsSchema);