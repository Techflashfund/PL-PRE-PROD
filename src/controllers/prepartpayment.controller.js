const { v4: uuidv4 } = require('uuid');
const DisbursedLoan = require('../models/disbursed.model');
const PrePayment = require('../models/prepartpayment');
const UpdateService = require('../services/update.services');
const PrePartMessageIds = require('../models/prepartmsgids.model');


class PrePaymentController {
    static async initiatePrePayment(req, res) {
        try {
            const { transactionId, amount } = req.body;
            
            const loan = await DisbursedLoan.findOne({ transactionId });
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }

            const storedResponse = loan.Response;
            const orderId = storedResponse.message.order.id;
            const context = storedResponse.context;
            const messageId = uuidv4();
            const prePaymentPayload = {
                context: {
                    ...context,
                    action: "update",
                    message_id:messageId,
                    timestamp: new Date().toISOString()
                },
                message: {
                    update_target: "payments",
                    order: {
                        id: orderId,
                        payments: [{
                            params: {
                                amount: amount.toString(),
                                currency: "INR"
                            },
                            time: {
                                label: "PRE_PART_PAYMENT"
                            }
                        }]
                    }
                }
            };
            await PrePartMessageIds.create({
                transactionId,
                messageId,
                type: 'PREPART',
                status: 'no'
            });

            const updateResponse = await UpdateService.makeUpdateRequest(prePaymentPayload);

            await PrePayment.findOneAndUpdate(
                { transactionId },
                {
                    $set: {
                        loanId: loan._id,
                        amount: amount,
                        status: 'INITIATED',
                        requestDetails: {
                            payload: prePaymentPayload,
                            timestamp: new Date()
                        },
                        responseDetails: {
                            payload: updateResponse,
                            timestamp: new Date()
                        },
                        initiatedBy: req.body.userId
                    }
                },
                { 
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            res.status(200).json({
                message: 'Pre-payment request initiated successfully',
                prePaymentPayload,
                response: updateResponse
            });

        } catch (error) {
            console.error('Pre-payment initiation failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async initiatemissedemi(req, res) {
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
            const prePaymentPayload = {
                context: {
                    ...context,
                    action: "update",
                    message_id:messageId,
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
            

            const updateResponse = await UpdateService.makeUpdateRequest(prePaymentPayload);

            

            res.status(200).json({
                message: 'missed request initiated successfully',
                prePaymentPayload,
                response: updateResponse
            });

        } catch (error) {
            console.error('Pre-payment initiation failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = PrePaymentController;