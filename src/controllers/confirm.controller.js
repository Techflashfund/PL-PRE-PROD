const InitThree = require('../models/initthree.model');
const Transaction=require('../models/transaction.model')
const Confirm=require('../models/confirm.model')
const ConfirmPayloadHandler = require('../utils/confirm.utils');
const ConfirmService = require('../services/confirm.services');

class ConfirmController {
    static async confirm(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }

            const initThree = await InitThree.findOne({ transactionId });

            if (!initThree) {
                return res.status(404).json({ error: 'Init three record not found' });
            }

            

            const confirmPayload = ConfirmPayloadHandler.createConfirmPayload(initThree);
            const confirmResponse = await ConfirmService.makeConfirmRequest(confirmPayload);

            await Transaction.findOneAndUpdate(
                { transactionId },
                { status: 'CONFIRM_INITIATED' }
            );

            res.status(200).json({
                message: 'Confirm request initiated successfully',
                confirmResponse
            });

        } catch (error) {
            console.error('Confirm request failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async onConfirm(req, res) {
        try {
            const { context, message } = req.body;
            const { order } = message;
    
            const loanInfo = order.items[0].tags[0].list;
            const breakup = order.quote.breakup;
    
            const confirmData = {
                transactionId: context.transaction_id,
                providerId: order.provider.id,
                confirmPayload: req.body,
                status: order.fulfillments[0].state.descriptor.code,
                confirmationId: order.id,
                loanDetails: {
                    amount: order.items[0].price.value,
                    currency: order.items[0].price.currency,
                    interestRate: loanInfo.find(i => i.descriptor.code === 'INTEREST_RATE')?.value,
                    term: loanInfo.find(i => i.descriptor.code === 'TERM')?.value,
                    interestRateType: loanInfo.find(i => i.descriptor.code === 'INTEREST_RATE_TYPE')?.value,
                    applicationFee: loanInfo.find(i => i.descriptor.code === 'APPLICATION_FEE')?.value,
                    foreclosureFee: loanInfo.find(i => i.descriptor.code === 'FORECLOSURE_FEE')?.value,
                    installmentAmount: loanInfo.find(i => i.descriptor.code === 'INSTALLMENT_AMOUNT')?.value,
                    repaymentFrequency: loanInfo.find(i => i.descriptor.code === 'REPAYMENT_FREQUENCY')?.value,
                    numberOfInstallments: loanInfo.find(i => i.descriptor.code === 'NUMBER_OF_INSTALLMENTS_OF_REPAYMENT')?.value
                },
                breakdown: {
                    principal: breakup.find(b => b.title === 'PRINCIPAL')?.price.value,
                    interest: breakup.find(b => b.title === 'INTEREST')?.price.value,
                    processingFee: breakup.find(b => b.title === 'PROCESSING_FEE')?.price.value,
                    insuranceCharges: breakup.find(b => b.title === 'INSURANCE_CHARGES')?.price.value,
                    netDisbursedAmount: breakup.find(b => b.title === 'NET_DISBURSED_AMOUNT')?.price.value,
                    otherCharges: breakup.find(b => b.title === 'OTHER_CHARGES')?.price.value
                },
                customerDetails: {
                    name: order.fulfillments[0].customer.person.name,
                    phone: order.fulfillments[0].customer.contact.phone,
                    email: order.fulfillments[0].customer.contact.email
                },
                paymentSchedule: order.payments
                    .filter(p => p.type === 'POST_FULFILLMENT')
                    .map(p => ({
                        installmentId: p.id,
                        amount: p.params.amount,
                        startDate: p.time.range.start,
                        endDate: p.time.range.end,
                        status: p.status
                    })),
                documents: order.documents.map(doc => ({
                    code: doc.descriptor.code,
                    name: doc.descriptor.name,
                    description: doc.descriptor.long_desc,
                    url: doc.url,
                    mimeType: doc.mime_type
                }))
            };
    
            const confirm = await Confirm.create(confirmData);
            res.status(200).json({ message: 'Confirmation saved successfully', confirm });
    
        } catch (error) {
            console.error('Error in onConfirm:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
}

module.exports = ConfirmController;