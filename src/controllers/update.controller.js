const { v4: uuidv4 } = require('uuid');
const Update = require('../models/update.model'); // Import the Update model
const Transaction = require('../models/transaction.model'); // Import the Transaction model
const UpdateService = require('../services/update.services'); // Import the Update service
const DisbursedLoan = require('../models/disbursed.model');
const ForeclosureLinks = require('../models/forclosurelink.model');
const CompletedLoan = require('../models/completed.model');
const TempData = require('../models/tempdata');
const MissedEmiLinks = require('../models/missedemilinks');
const PrePartPaymentLinks = require('../models/prepartlink');


class UpdateController{
    static async update(req,res){
        return null
    }
    static async getPaymentUrl(req, res) {
        try {
            const { transactionId } = req.params;
            const { type } = req.query; // Assuming `type` is passed as a query parameter
    
            // Check if the type is provided and validate it
            if (!type || !['prepayment', 'foreclosure', 'missed'].includes(type)) {
                return res.status(400).json({ message: 'Invalid or missing payment type' });
            }
    
            let paymentLink;
    
            // Find the payment URL based on the type
            if (type === 'foreclosure') {
                paymentLink = await ForeclosureLinks.findOne({ transactionId });
            } else if (type === 'missed') {
                paymentLink = await MissedEmiLinks.findOne({ transactionId });
            } else if (type === 'prepayment') {
                paymentLink = await PrePartPaymentLinks.findOne({ transactionId });
            }
            console.log('paymentLink',paymentLink.Response);
            
            if (paymentLink) {
                return res.status(200).json({
                    transactionId,
                    paymentUrl: paymentLink.paymentUrl,
                    paymentDetails: paymentLink.paymentDetails,
                    details:paymentLink.Response
                });
            }
    
            return res.status(404).json({ message: 'Payment URL not found for the given transaction ID and type' });
    
        } catch (error) {
            console.error('Error fetching payment URL:', error);
            res.status(500).json({ error: error.message });
        }
    }
    

    static async onupdate(req, res) {
        try {
            const tempData = await TempData.create({
                        transactionId: req.body.context?.transaction_id,
                        messageId: req.body.context?.message_id,
                        responseData: req.body,
                        
                    });

              if(tempData){
                console.log('await done');
                
              }      
            const { context, message } = req.body;
            const { order } = message;
            const fulfillmentState = order.fulfillments[0].state.descriptor.code;

            // Save update response
            const foreclosurePayment = order.payments.find(p => 
                p.time?.label === 'FORECLOSURE' && p.url
            );
            if (foreclosurePayment) {
                await ForeclosureLinks.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    {
                        $set: {
                            orderId: order.id,
                            paymentUrl: foreclosurePayment.url,
                            Response:req.body,
                            paymentDetails: {
                                amount: foreclosurePayment.params.amount,
                                currency: foreclosurePayment.params.currency,
                                status: foreclosurePayment.status
                            },
                            updatedAt: new Date()
                        }
                    },
                    { 
                        new: true, 
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );
            }
            const missedEmiPayment = order.payments.find(p => 
                p.time?.label === "MISSED_EMI_PAYMENT" && p.url
            );
            if (missedEmiPayment) {
                await MissedEmiLinks.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    {
                        $set: {
                            orderId: order.id,
                            paymentUrl: missedEmiPayment.url,
                            Response:req.body,
                            paymentDetails: {
                                amount: missedEmiPayment.params.amount,
                                currency: missedEmiPayment.params.currency,
                                status: missedEmiPayment.status
                            },
                            updatedAt: new Date()
                        }
                    },
                    { 
                        new: true, 
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );
            }
            const prePartPayment = order.payments.find(p => 
                p.time?.label === 'PRE_PART_PAYMENT' && p.url
            );
            if (prePartPayment) {
                await PrePartPaymentLinks.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    {
                        $set: {
                            orderId: order.id,
                            paymentUrl: prePartPayment.url,
                            Response:req.body,
                            paymentDetails: {
                                amount: prePartPayment.params.amount,
                                currency: prePartPayment.params.currency,
                                status: prePartPayment.status
                            },
                            updatedAt: new Date()
                        }
                    },
                    { 
                        new: true, 
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );
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
                        version: "2.0.1",
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
            if (fulfillmentState === 'COMPLETE') {
                await CompletedLoan.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    {
                        $set: {
                            providerId: order.provider.id,
                            loanDetails: {
                                amount: order.items[0].price.value,
                                currency: order.items[0].price.currency,
                                term: order.items[0].tags[0].list.find(
                                    (i) => i.descriptor.code === "TERM"
                                )?.value,
                                interestRate: order.items[0].tags[0].list.find(
                                    (i) => i.descriptor.code === "INTEREST_RATE"
                                )?.value
                            },
                            Response: req.body,
                            completionDate: new Date()
                        }
                    },
                    { 
                        new: true, 
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );
            
                await Transaction.findOneAndUpdate(
                    { transactionId: context.transaction_id },
                    { status: 'LOAN_COMPLETED' },
                    { new: true }
                );
            }
           
            // if (fulfillmentState === 'DISBURSED') {
            //     const loanInfo = message.order.items[0].tags[0].list;
            //     const breakup = message.order.quote.breakup;
            
            //     await DisbursedLoan.create({
            //         transactionId: context.transaction_id,
            //         providerId: message.order.provider.id,
            //         loanDetails: {
            //             amount: message.order.items[0].price.value,
            //             currency: message.order.items[0].price.currency,
            //             interestRate: loanInfo.find(i => i.descriptor.code === 'INTEREST_RATE')?.value,
            //             term: loanInfo.find(i => i.descriptor.code === 'TERM')?.value,
            //             repaymentFrequency: loanInfo.find(i => i.descriptor.code === 'REPAYMENT_FREQUENCY')?.value,
            //             totalInstallments: loanInfo.find(i => i.descriptor.code === 'NUMBER_OF_INSTALLMENTS_OF_REPAYMENT')?.value
            //         },
            //         breakdown: {
            //             principal: breakup.find(b => b.title === 'PRINCIPAL')?.price.value,
            //             interest: breakup.find(b => b.title === 'INTEREST')?.price.value,
            //             processingFee: breakup.find(b => b.title === 'PROCESSING_FEE')?.price.value,
            //             insuranceCharges: breakup.find(b => b.title === 'INSURANCE_CHARGES')?.price.value,
            //             netDisbursedAmount: breakup.find(b => b.title === 'NET_DISBURSED_AMOUNT')?.price.value,
            //             outstandingPrincipal: breakup.find(b => b.title === 'OUTSTANDING_PRINCIPAL')?.price.value,
            //             outstandingInterest: breakup.find(b => b.title === 'OUTSTANDING_INTEREST')?.price.value
            //         },
            //         customerDetails: {
            //             name: message.order.fulfillments[0].customer.person.name,
            //             phone: message.order.fulfillments[0].customer.contact.phone,
            //             email: message.order.fulfillments[0].customer.contact.email
            //         },
            //         paymentSchedule: message.order.payments
            //             .filter(p => p.type === 'POST_FULFILLMENT')
            //             .map(p => ({
            //                 installmentId: p.id,
            //                 amount: p.params.amount,
            //                 currency: p.params.currency,
            //                 startDate: p.time.range.start,
            //                 endDate: p.time.range.end,
            //                 status: p.status
            //             })),
            //         documents: message.order.documents.map(doc => ({
            //             code: doc.descriptor.code,
            //             name: doc.descriptor.name,
            //             description: doc.descriptor.long_desc,
            //             url: doc.url,
            //             mimeType: doc.mime_type
            //         })),
            //         Response:req.body
            //     });
            
            //     await Transaction.findOneAndUpdate(
            //         { transactionId: context.transaction_id },
            //         { status: 'LOAN_DISBURSED' }
            //     );
            // }

            res.status(200).json({ message: 'Update processed successfully' });

        } catch (error) {
            console.error('Error processing update:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports=UpdateController