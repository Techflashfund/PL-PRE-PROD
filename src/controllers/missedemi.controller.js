const { v4: uuidv4 } = require('uuid');
const DisbursedLoan = require('../models/disbursed.model');
const UpdateService = require('../services/update.services');
const MissedEmi = require('../models/missedemischema.model');
const MissedEmiMessageIds = require('../models/missedmessageids');

class MissedEmiController {
    static async initiateMissedEmi(req, res) {
        try {
            const { transactionId } = req.body;
            
            const loan = await DisbursedLoan.findOne({ transactionId });
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }

            const storedResponse = loan.Response;
            const orderId = storedResponse.message.order.id;
            const context = storedResponse.context;
            const messageId = uuidv4();

            const missedEmiPayload = {
                context: {
                    ...context,
                    action: "update",
                    message_id: messageId,
                    timestamp: new Date().toISOString()
                },
                message: {
                    update_target: "payments",
                    order: {
                        id: orderId,
                        payments: [{
                            time: {
                                label: "MISSED_EMI_PAYMENT"
                            }
                        }]
                    }
                }
            };

            await MissedEmiMessageIds.create({
                transactionId,
                messageId,
                type: 'MISSED_EMI',
                status: 'no'
            });

            const updateResponse = await UpdateService.makeUpdateRequest(missedEmiPayload);
            
            await MissedEmi.findOneAndUpdate(
                { transactionId },
                {
                    $set: {
                        loanId: loan._id,
                        status: 'INITIATED',
                        requestDetails: {
                            payload: missedEmiPayload,
                            timestamp: new Date()
                        },
                        responseDetails: {
                            payload: updateResponse,
                            timestamp: new Date()
                        },
                        initiatedBy: req.body.userId,
                        updatedAt: new Date()
                    }
                },
                { 
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            res.status(200).json({
                message: 'Missed EMI update initiated successfully',
                missedEmiPayload,
                response: updateResponse
            });

        } catch (error) {
            console.error('Missed EMI update failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = MissedEmiController;