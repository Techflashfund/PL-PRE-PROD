const SelectThree = require('../models/selectThree.model');
const InitService = require('../services/init.services');
const InitRequestUtils = require('../utils/init.request.utils');
const InitOne = require('../models/initone.model');
const InitTwo = require('../models/inittwo.nodel');
const InitThree = require('../models/initthree.model');
const Transaction = require('../models/transaction.model');
const Status=require('../models/status.model');
class StatusController {
    static async onStatus(req, res) {
        try {
            const { context, message } = req.body;
            const { order } = message;
            const formId = message.order.items[0].xinput.form.id;
            const formResponse = message.order.items[0].xinput.form_response;

            // Find matching SelectThree record
            const selectThree = await SelectThree.findOne({
                transactionId: context.transaction_id,
                formId: formId
            });

            if (selectThree) {
                // Update KYC status
                await SelectThree.findByIdAndUpdate(
                    selectThree._id,
                    {
                        kycStatus: formResponse.status,
                        kycSubmissionId: formResponse.submission_id
                    }
                );

                // If KYC approved, make init call
                if (formResponse.status === 'APPROVED') {
                    const initPayload = await InitRequestUtils.createInitOnePayload(selectThree,formResponse.submission_id);
                    const initResponse=await InitService.makeInitRequest(initPayload);
                    await InitOne.create({
                        transactionId: context.transaction_id,
                        providerId: message.order.provider.id,
                        initPayload,
                        initResponse,
                        status: 'INITIATED',
                        kycSubmissionId: formResponse.submission_id,
                        responseTimestamp: new Date()
                    });
                    await Transaction.findOneAndUpdate(
                        { transactionId: context.transaction_id },
                        { status: 'INITONE_INITIATED' }
                    );
                }

            }

            const initTwo = await InitTwo.findOne({
                transactionId: context.transaction_id,
                emandateformId: formId
            });

            if (initTwo) {
                await InitTwo.findByIdAndUpdate(
                    initTwo._id,
                    {
                        emandateStatus: formResponse.status,
                        emandateSubmissionId: formResponse.submission_id
                    }
                );
                if (formResponse.status === 'APPROVED') {
                    const initThreePayload = await InitRequestUtils.createInitThreePayload(
                        initTwo,
                        formResponse.submission_id,
                        formId
                    );
                    const initResponse = await InitService.makeInitRequest(initThreePayload);
                    
                    await InitThree.create({
                        transactionId: context.transaction_id,
                        providerId: message.order.provider.id,
                        initPayload: initThreePayload,
                        initResponse,
                        status: 'INITIATED',
                        emandateSubmissionId: formResponse.submission_id,
                        responseTimestamp: new Date()
                    });

                    await Transaction.findOneAndUpdate(
                        { transactionId: context.transaction_id },
                        { status: 'INITTHREE_INITIATED' }
                    );
                }

            }

            const initThree = await InitThree.findOne({
                transactionId: context.transaction_id,
                documentformId: formId
            });

            if (initThree) {
                await InitThree.findByIdAndUpdate(
                    initThree._id,
                    {
                        documentStatus: formResponse.status,
                        documentSubmissionId: formResponse.submission_id
                    }
                );
        
                if (formResponse.status === 'APPROVED') {
                    await Transaction.findOneAndUpdate(
                        { transactionId: context.transaction_id },
                        { status: 'INITTHREE_COMPLETED' }
                    );
                }
            }

            

            // Save status response
            await Status.create({
                transactionId: context.transaction_id,
                providerId: order.provider.id,
                bppId: context.bpp_id,
                formId: order.items[0].xinput.form.id,
                formResponse: order.items[0].xinput.form_response,
                loanDetails: {
                    amount: order.items[0].price?.value,
                    term: order.items[0]?.tags?.[0]?.list?.find(i => i.descriptor?.code === 'TERM')?.value,
                    interestRate: order.items[0]?.tags?.[0]?.list?.find(i => i.descriptor?.code === 'INTEREST_RATE')?.value,
                    installmentAmount: order.items[0]?.tags?.[0]?.list?.find(i => i.descriptor?.code === 'INSTALLMENT_AMOUNT')?.value
                },
                paymentSchedule: order.payments && Array.isArray(order.payments) 
                    ? order.payments
                        .filter(p => p && p.type === 'POST_FULFILLMENT')
                        .map(p => ({
                            installmentId: p.id,
                            amount: p.params?.amount,
                            dueDate: p.time?.range?.end,
                            status: p.status
                        }))
                    : [],
                statusResponse: req.body
            });

            res.status(200).json({ 
                message: 'Status processed successfully',
                isApproved: formResponse.status === 'APPROVED'
            });

        } catch (error) {
            console.error('Status processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = StatusController;