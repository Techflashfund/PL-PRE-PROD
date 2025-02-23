const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Update schema
const updateSchema = new Schema(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        providerId: {
            type: String,
            required: true,
        },
        updatePayload: {
            type: Object, // Storing the whole payload as an object
            required: true,
        },
        updateResponse: {
            messageId: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                required: true,
            },
        },
        status: {
            type: String, // This stores the fulfillment state code like 'SANCTIONED', 'DISBURSED'
            required: true,
        },
        updateId: {
            type: String,
            required: true,
        },
        updateTimestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt
    }
);

// Create the Update model
const Update = mongoose.model('Update', updateSchema);

module.exports = Update;
