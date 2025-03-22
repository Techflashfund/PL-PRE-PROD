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
            if (fulfillmentState === 'COMPLETED') {
                // First find the disbursed loan
                const disbursedLoan = await DisbursedLoan.findOne({ 
                    transactionId: context.transaction_id 
                });
            
                if (disbursedLoan) {
                    // Create completed loan record
                    await CompletedLoan.findOneAndUpdate(
                        { transactionId: context.transaction_id },
                        {
                            $set: {
                                providerId: order.provider.id,
                                loanDetails: disbursedLoan.loanDetails,
                                breakdown: disbursedLoan.breakdown,
                                customerDetails: disbursedLoan.customerDetails,
                                paymentSchedule: disbursedLoan.paymentSchedule,
                                documents: disbursedLoan.documents,
                                Response: req.body,
                                completionDate: new Date(),
                                disbursedLoanDetails: disbursedLoan.Response // Store original disbursement details
                            }
                        },
                        { 
                            new: true, 
                            upsert: true,
                            setDefaultsOnInsert: true
                        }
                    );
            
                    // Delete from disbursed loans
                    await DisbursedLoan.deleteOne({ 
                        transactionId: context.transaction_id 
                    });
            
                    // Update transaction status
                    await Transaction.findOneAndUpdate(
                        { transactionId: context.transaction_id },
                        { status: 'LOAN_COMPLETED' },
                        { new: true }
                    );
                } else {
                    console.warn(`No disbursed loan found for transaction ${context.transaction_id}`);
                    // Still create completed loan record with available data
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
                }
            }
           
            if (fulfillmentState === "DISBURSED") {
                      try {
                        const saved = await Transaction.findOneAndUpdate(
                          { transactionId: context.transaction_id  },
                          { status: "LOAN_DISBURSED" },
                          { new: true }
                        );
                        console.log('saved', saved);
                        
                        const updatedLoan = await DisbursedLoan.findOneAndUpdate(
                          { transactionId: context.transaction_id  },
                          {
                              $set: {
                                  providerId: order.provider.id,
                                  providerDetails: {
                                      name: order.provider.descriptor.name,
                                      shortDesc: order.provider.descriptor.short_desc,
                                      longDesc: order.provider.descriptor.long_desc,
                                      logo: order.provider.descriptor.images?.[0]?.url,
                                      contact: {
                                          groName: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_NAME")?.value,
                                          groEmail: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_EMAIL")?.value,
                                          groPhone: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_CONTACT_NUMBER")?.value,
                                          groDesignation: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_DESIGNATION")?.value,
                                          groAddress: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "GRO_ADDRESS")?.value,
                                          supportLink: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "CUSTOMER_SUPPORT_LINK")?.value,
                                          supportPhone: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "CUSTOMER_SUPPORT_CONTACT_NUMBER")?.value,
                                          supportEmail: order.provider.tags?.[0]?.list?.find(i => i.descriptor.code === "CUSTOMER_SUPPORT_EMAIL")?.value
                                      },
                                      lspInfo: {
                                          name: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_NAME")?.value,
                                          email: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_EMAIL")?.value,
                                          phone: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_CONTACT_NUMBER")?.value,
                                          address: order.provider.tags?.[1]?.list?.find(i => i.descriptor.code === "LSP_ADDRESS")?.value
                                      }
                                  },
                                  loanDetails: {
                                      amount: order.items[0].price.value,
                                      currency: order.items[0].price.currency,
                                      term: order.items[0].tags[0].list.find(i => i.descriptor.code === "TERM")?.value,
                                      interestRate: order.items[0].tags[0].list.find(i => i.descriptor.code === "INTEREST_RATE")?.value,
                                      interestRateType: order.items[0].tags[0].list.find(i => i.descriptor.code === "INTEREST_RATE_TYPE")?.value,
                                      applicationFee: order.items[0].tags[0].list.find(i => i.descriptor.code === "APPLICATION_FEE")?.value,
                                      foreclosureFee: order.items[0].tags[0].list.find(i => i.descriptor.code === "FORECLOSURE_FEE")?.value,
                                      conversionCharge: order.items[0].tags[0].list.find(i => i.descriptor.code === "INTEREST_RATE_CONVERSION_CHARGE")?.value,
                                      delayPenalty: order.items[0].tags[0].list.find(i => i.descriptor.code === "DELAY_PENALTY_FEE")?.value,
                                      otherPenalty: order.items[0].tags[0].list.find(i => i.descriptor.code === "OTHER_PENALTY_FEE")?.value,
                                      annualPercentageRate: order.items[0].tags[0].list.find(i => i.descriptor.code === "ANNUAL_PERCENTAGE_RATE")?.value,
                                      repaymentFrequency: order.items[0].tags[0].list.find(i => i.descriptor.code === "REPAYMENT_FREQUENCY")?.value,
                                      numberOfInstallments: order.items[0].tags[0].list.find(i => i.descriptor.code === "NUMBER_OF_INSTALLMENTS_OF_REPAYMENT")?.value,
                                      tncLink: order.items[0].tags[0].list.find(i => i.descriptor.code === "TNC_LINK")?.value,
                                      coolOffPeriod: order.items[0].tags[0].list.find(i => i.descriptor.code === "COOL_OFF_PERIOD")?.value,
                                      installmentAmount: order.items[0].tags[0].list.find(i => i.descriptor.code === "INSTALLMENT_AMOUNT")?.value
                                  },
                                  breakdown: order.quote.breakup.map(item => ({
                                      title: item.title,
                                      amount: item.price.value,
                                      currency: item.price.currency
                                  })),
                                  customer: {
                                      name: order.fulfillments[0].customer.person.name,
                                      phone: order.fulfillments[0].customer.contact.phone,
                                      email: order.fulfillments[0].customer.contact.email
                                  },
                                  paymentSchedule: order.payments
                                      .filter(p => p.time?.label === "INSTALLMENT")
                                      .map(p => ({
                                          installmentId: p.id,
                                          amount: p.params.amount,
                                          currency: p.params.currency,
                                          status: p.status,
                                          startDate: p.time.range.start,
                                          endDate: p.time.range.end
                                      })),
                                  documents: order.documents?.map(doc => ({
                                      code: doc.descriptor.code,
                                      name: doc.descriptor.name,
                                      description: doc.descriptor.long_desc,
                                      mimeType: doc.mime_type,
                                      url: doc.url
                                  })) || [],
                                  status: "DISBURSED",
                                  Response: req.body,
                                  
                                  updatedAt: new Date()
                              }
                          },
                          {
                              new: true,
                              upsert: true,
                              setDefaultsOnInsert: true
                          }
                        );
              
                        console.log(`DisbursedLoan updated for transaction: ${context.transaction_id }`);
              
                        // Return immediately after processing DISBURSED state
                        return res.status(200).json({
                          message: "Loan disbursement processed successfully",
                        });
                      } catch (error) {
                        console.error("Error updating disbursed loan:", error);
                        throw error;
                      }
                    }

            res.status(200).json({ message: 'Update processed successfully' });

        } catch (error) {
            console.error('Error processing update:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports=UpdateController