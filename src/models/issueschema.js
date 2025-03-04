const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true
    },
    issueId: {
        type: String,
        required: true
    },
    complainantInfo: {
        name: String,
        phone: String,
        email: String
    },
    description: {
        shortDesc: String,
        longDesc: String
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    requestDetails: {
        payload: Object,
        timestamp: Date
    },
    responseDetails: {
        payload: Object,
        timestamp: Date
    },
    resolution: {
        shortDesc: String,
        longDesc: String,
        actionTriggered: String
    },
    respondentActions: [{
        respondentAction: String,
        shortDesc: String,
        updatedAt: Date,
        updatedBy: {
            org: {
                name: String
            },
            contact: {
                phone: String,
                email: String
            },
            person: {
                name: String
            }
        },
        cascadedLevel: Number
    }],
    resolutionProvider: {
        respondentInfo: {
            type: String,
            organization: {
                org: {
                    name: String
                },
                contact: {
                    phone: String,
                    email: String
                },
                person: {
                    name: String
                }
            },
            resolutionSupport: {
                contact: {
                    phone: String,
                    email: String
                },
                gros: [{
                    person: {
                        name: String
                    },
                    contact: {
                        phone: String,
                        email: String
                    },
                    groType: String
                }]
            }
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Issue', issueSchema);