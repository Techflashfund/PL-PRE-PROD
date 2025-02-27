const mongoose = require('mongoose');

const onStatusLogSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    payload: {
        type: Object,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('OnStatusLog', onStatusLogSchema);