const { v4: uuidv4 } = require('uuid');
const Update = require('../models/update.model'); // Import the Update model
const Transaction = require('../models/transaction.model'); // Import the Transaction model
const UpdateService = require('../services/update.services'); // Import the Update service
const DisbursedLoan = require('../models/disbursed.model');
const ForeclosureLinks = require('../models/forclosurelink.model');

class UpdateController{
    static async update(req,res){
        return null
    }


    static async onupdate(req, res) {
        try {
            const { context, message } = req.body;
            const { order } = message;
            const fulfillmentState = order.fulfillments[0].state.descriptor.code;

            // Save update response
            const foreclosurePayment = order.payments.find(p => 
                p.time?.label === 'FORECLOSURE' && p.url
            );
            if (foreclosurePayment) {
                await ForeclosureLinks.create({
                    transactionId: context.transaction_id,
                    orderId: order.id,
                    paymentUrl: foreclosurePayment.url,
                    paymentDetails: {
                        amount: foreclosurePayment.params.amount,
                        currency: foreclosurePayment.params.currency,
                        status: foreclosurePayment.status
                    }
                });
            }

            

            // If consent is required, create consent update payload
            if (fulfillmentState === 'CONSENT_REQUIRED') {

                await Transaction.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    { status: 'CONSENT_REQUIRED' }
                );
                const updatePayload = {
                    context: {
                        domain: "ONDC:FIS12",
                        location: {
                            country: { code: "IND" },
                            city: { code: "*" }
                        },
                        transaction_id: context.transaction_id,
                        message_id: uuidv4(),
                        action: "update",
                        timestamp: new Date().toISOString(),
                        version: "2.0.0",
                        bap_uri: context.bap_uri,
                        bap_id: context.bap_id,
                        bpp_id: context.bpp_id,
                        bpp_uri: context.bpp_uri,
                        ttl: "PT10M"
                    },
                    message: {
                        update_target: "fulfillment",
                        order: {
                            id: order.id,
                            fulfillments: [{
                                state: {
                                    descriptor: {
                                        code: "APPROVED"
                                    }
                                }
                            }]
                        }
                    }
                };

                const updateResponse = await UpdateService.makeUpdateRequest(updatePayload);
                
                // await Update.findOneAndUpdate(
                //     { transactionId: context.transaction_id },
                //     {
                //         $set: {
                //             providerId: message.order.provider.id,
                //             updatePayload: req.body,
                //             updateResponse: {
                //                 messageId: context.message_id,
                //                 timestamp: context.timestamp,
                //             },
                //             status: fulfillmentState,
                //             updateId: message.order.id,
                //             consentUpdatePayload: updatePayload,
                //             consentUpdateResponse: updateResponse,
                //             updatedAt: new Date()
                //         }
                //     },
                //     { 
                //         upsert: true, 
                //         new: true,
                //         setDefaultsOnInsert: true 
                //     }
                // );
            }
           
            if (fulfillmentState === 'DISBURSED') {
                const loanInfo = message.order.items[0].tags[0].list;
                const breakup = message.order.quote.breakup;
            
                await DisbursedLoan.create({
                    transactionId: context.transaction_id,
                    providerId: message.order.provider.id,
                    loanDetails: {
                        amount: message.order.items[0].price.value,
                        currency: message.order.items[0].price.currency,
                        interestRate: loanInfo.find(i => i.descriptor.code === 'INTEREST_RATE')?.value,
                        term: loanInfo.find(i => i.descriptor.code === 'TERM')?.value,
                        repaymentFrequency: loanInfo.find(i => i.descriptor.code === 'REPAYMENT_FREQUENCY')?.value,
                        totalInstallments: loanInfo.find(i => i.descriptor.code === 'NUMBER_OF_INSTALLMENTS_OF_REPAYMENT')?.value
                    },
                    breakdown: {
                        principal: breakup.find(b => b.title === 'PRINCIPAL')?.price.value,
                        interest: breakup.find(b => b.title === 'INTEREST')?.price.value,
                        processingFee: breakup.find(b => b.title === 'PROCESSING_FEE')?.price.value,
                        insuranceCharges: breakup.find(b => b.title === 'INSURANCE_CHARGES')?.price.value,
                        netDisbursedAmount: breakup.find(b => b.title === 'NET_DISBURSED_AMOUNT')?.price.value,
                        outstandingPrincipal: breakup.find(b => b.title === 'OUTSTANDING_PRINCIPAL')?.price.value,
                        outstandingInterest: breakup.find(b => b.title === 'OUTSTANDING_INTEREST')?.price.value
                    },
                    customerDetails: {
                        name: message.order.fulfillments[0].customer.person.name,
                        phone: message.order.fulfillments[0].customer.contact.phone,
                        email: message.order.fulfillments[0].customer.contact.email
                    },
                    paymentSchedule: message.order.payments
                        .filter(p => p.type === 'POST_FULFILLMENT')
                        .map(p => ({
                            installmentId: p.id,
                            amount: p.params.amount,
                            currency: p.params.currency,
                            startDate: p.time.range.start,
                            endDate: p.time.range.end,
                            status: p.status
                        })),
                    documents: message.order.documents.map(doc => ({
                        code: doc.descriptor.code,
                        name: doc.descriptor.name,
                        description: doc.descriptor.long_desc,
                        url: doc.url,
                        mimeType: doc.mime_type
                    })),
                    Response:req.body
                });
            
                await Transaction.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    { status: 'LOAN_DISBURSED' }
                );
            }

            res.status(200).json({ message: 'Update processed successfully' });

        } catch (error) {
            console.error('Error processing update:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports=UpdateController