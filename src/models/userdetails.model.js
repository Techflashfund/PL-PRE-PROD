const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { 
        type: String, 
        enum: ['male', 'female', 'transgender'],
        required: true 
    },
    pan: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    officialEmail: String,
    employmentType: {
        type: String,
        enum: ['salaried', 'selfEmployed'],
        required: true
    },
    endUse: {
        type: String,
        enum: ['consumerDurablePurchase', 'education', 'travel', 'health', 'other'],
        required: true
    },
    income: { type: Number, required: true },
    companyName: { type: String, required: true },
    udyamNumber: String,
    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    // aa_id: String,
    bureauConsent: { type: Boolean, required: true },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserDetails', userDetailsSchema);