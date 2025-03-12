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
        console.log("Processing onConfirm...");
    
        const { context, message } = req.body;
        const order = message?.order;
    
        // Validate required fields
        if (!context?.transaction_id || !order?.provider?.id || !order?.items?.length) {
            return res.status(400).json({ success: false, error: "NACK - Missing required fields" });
        }
    
        try {
            const loanInfo = order.items[0]?.tags?.[0]?.list ?? [];
            const breakup = order?.quote?.breakup ?? [];
    
            const confirmData = {
                transactionId: context.transaction_id,
                providerId: order.provider.id,
                confirmPayload: req.body,
                status: order.fulfillments[0]?.state?.descriptor?.code ?? "UNKNOWN",
                confirmationId: order.id,
                loanDetails: {
                    amount: order.items[0]?.price?.value ?? "0",
                    currency: order.items[0]?.price?.currency ?? "INR",
                    interestRate: loanInfo.find(i => i.descriptor.code === 'INTEREST_RATE')?.value ?? "N/A",
                    term: loanInfo.find(i => i.descriptor.code === 'TERM')?.value ?? "N/A",
                    interestRateType: loanInfo.find(i => i.descriptor.code === 'INTEREST_RATE_TYPE')?.value ?? "N/A",
                    applicationFee: loanInfo.find(i => i.descriptor.code === 'APPLICATION_FEE')?.value ?? "0",
                    foreclosureFee: loanInfo.find(i => i.descriptor.code === 'FORECLOSURE_FEE')?.value ?? "0",
                    installmentAmount: loanInfo.find(i => i.descriptor.code === 'INSTALLMENT_AMOUNT')?.value ?? "0",
                    repaymentFrequency: loanInfo.find(i => i.descriptor.code === 'REPAYMENT_FREQUENCY')?.value ?? "N/A",
                    numberOfInstallments: loanInfo.find(i => i.descriptor.code === 'NUMBER_OF_INSTALLMENTS_OF_REPAYMENT')?.value ?? "N/A"
                },
                breakdown: {
                    principal: breakup.find(b => b.title === 'PRINCIPAL')?.price?.value ?? "0",
                    interest: breakup.find(b => b.title === 'INTEREST')?.price?.value ?? "0",
                    processingFee: breakup.find(b => b.title === 'PROCESSING_FEE')?.price?.value ?? "0",
                    insuranceCharges: breakup.find(b => b.title === 'INSURANCE_CHARGES')?.price?.value ?? "0",
                    netDisbursedAmount: breakup.find(b => b.title === 'NET_DISBURSED_AMOUNT')?.price?.value ?? "0",
                    otherCharges: breakup.find(b => b.title === 'OTHER_CHARGES')?.price?.value ?? "0"
                },
                customerDetails: {
                    name: order.fulfillments[0]?.customer?.person?.name ?? "N/A",
                    phone: order.fulfillments[0]?.customer?.contact?.phone ?? "N/A",
                    email: order.fulfillments[0]?.customer?.contact?.email ?? "N/A"
                },
                paymentSchedule: (order?.payments ?? [])
                    .filter(p => p.type === 'POST_FULFILLMENT')
                    .map(p => ({
                        installmentId: p.id ?? "N/A",
                        amount: p.params?.amount ?? "0",
                        startDate: p.time?.range?.start ?? "N/A",
                        endDate: p.time?.range?.end ?? "N/A",
                        status: p.status ?? "PENDING"
                    })),
                documents: (order?.documents ?? []).map(doc => ({
                    code: doc.descriptor?.code ?? "N/A",
                    name: doc.descriptor?.name ?? "N/A",
                    description: doc.descriptor?.long_desc ?? "",
                    url: doc.url ?? "N/A",
                    mimeType: doc.mime_type ?? "N/A"
                }))
            };
    
            // Store confirmation in DB
            await Confirm.create(confirmData);
    
            // Update Transaction status
            await Transaction.findOneAndUpdate(
                { transactionId: context.transaction_id },
                { status: "CONFIRM_COMPLETED" }
            );
    
            console.log("✅ onConfirm success: Confirmation stored and transaction updated.");
    
            return res.status(200).json({
                success: true,
                data: {
                    context: req.body.context,
                    message: { ack: { status: "ACK" } },
                    transactionId: context.transaction_id,
                    providerId: order.provider.id
                }
            });
    
        } catch (error) {
            console.error("❌ Error in onConfirm:", error);
    
            // Mark transaction as failed
            await Transaction.findOneAndUpdate(
                { transactionId: context.transaction_id },
                { status: "CONFIRM_FAILED" }
            );
    
            return res.status(500).json({ success: false, error: "NACK - Internal Server Error" });
        }
    }
    
    
}

module.exports = ConfirmController;