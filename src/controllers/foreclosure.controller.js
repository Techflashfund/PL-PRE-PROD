const { v4: uuidv4 } = require('uuid');
const DisbursedLoan = require('../models/disbursed.model');
const UpdateService = require('../services/update.services');
const Foreclosure = require('../models/forclosure');

class ForeclosureController {
    static async initiateForeclosure(req, res) {
        try {
            const { transactionId } = req.body;
            
            const loan = await DisbursedLoan.findOne({ transactionId });
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }

            const storedResponse = loan.Response;
            const orderId = storedResponse.message.order.id;
            const context = storedResponse.context;

            const foreclosurePayload = {
                context: {
                    ...context,
                    action: "update",
                    message_id: uuidv4(),
                    timestamp: new Date().toISOString()
                },
                message: {
                    update_target: "payments",
                    order: {
                        id: orderId,
                        payments: [{
                            time: {
                                label: "FORECLOSURE"
                            }
                        }]
                    }
                }
            };

            const updateResponse = await UpdateService.makeUpdateRequest(foreclosurePayload);
            await Foreclosure.create({
                transactionId,
                loanId: loan._id,
                status: 'INITIATED',
                requestDetails: {
                    payload: foreclosurePayload,
                    timestamp: new Date()
                },
                responseDetails: {
                    payload: updateResponse,
                    timestamp: new Date()
                },
                initiatedBy: req.body.userId
            });
            // Update loan status
           

            res.status(200).json({
                message: 'Foreclosure request initiated successfully',
                foreclosurePayload,
                response: updateResponse
            });

        } catch (error) {
            console.error('Foreclosure initiation failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ForeclosureController;