const SelectThree = require("../models/selectThree.model");
const InitService = require("../services/init.services");
const InitRequestUtils = require("../utils/init.request.utils");
const InitOne = require("../models/initone.model");
const InitTwo = require("../models/inittwo.nodel");
const EMandate = require("../models/mandate.model");
const InitThree = require("../models/initthree.model");
const KycStatus = require("../models/kyc.model");
const Transaction = require("../models/transaction.model");
const Document = require("../models/document.model");
const NoFormStatus = require("../models/nonstatus.model");
const Status = require("../models/status.model");
const DisbursedLoan = require("../models/disbursed.model");
const SanctionedLoan = require("../models/sanctioned.model");
const { v4: uuidv4 } = require("uuid");
const { statusRequest } = require("../services/status.service");
const OnStatusLog = require("../models/onstatuslog");
const CompletedLoan = require("../models/completed.model");

class StatusController {
    static async onStatus(req, res) {
        try {
          const { context, message } = req.body;
          
          if (!context || !message || !message.order) {
            return res.status(400).json({ error: "Invalid request body structure" });
          }
      
          console.log("Status request received:", req.body);
          
          // Log the status request
          await OnStatusLog.create({
            transactionId: context.transaction_id,
            payload: req.body,
          });
          
          const { order } = message;
          const transactionId = context.transaction_id;
          
          // Process fulfillment state if present
          if (order.fulfillments && order.fulfillments[0] && order.fulfillments[0].state && 
              order.fulfillments[0].state.descriptor && order.fulfillments[0].state.descriptor.code) {
            
            const fulfillmentState = order.fulfillments[0].state.descriptor.code;
            
            // Extract common loan details
            const loanDetails = {
              amount: order.items?.[0]?.price?.value,
              currency: order.items?.[0]?.price?.currency,
              term: order.items?.[0]?.tags?.[0]?.list?.find(
                (i) => i.descriptor?.code === "TERM"
              )?.value,
              interestRate: order.items?.[0]?.tags?.[0]?.list?.find(
                (i) => i.descriptor?.code === "INTEREST_RATE"
              )?.value,
            };
            
            // Handle DISBURSED state
            if (fulfillmentState === "DISBURSED") {
              try {
                const updatedLoan = await DisbursedLoan.findOneAndUpdate(
                  { transactionId },
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
                          
                          updatedAt: new Date()
                      }
                  },
                  {
                      new: true,
                      upsert: true,
                      setDefaultsOnInsert: true
                  }
              );
      
                console.log(`DisbursedLoan updated for transaction: ${transactionId}`);
      
                // Update transaction status
                await Transaction.findOneAndUpdate(
                  { transactionId },
                  { status: "LOAN_DISBURSED" },
                  { new: true }
                );
              } catch (error) {
                console.error("Error updating disbursed loan:", error);
                throw error;
              }
            }
            
            // Handle SANCTIONED state
            if (fulfillmentState === "SANCTIONED") {
              await SanctionedLoan.findOneAndUpdate(
                { transactionId },
                {
                  $set: {
                    providerId: order.provider.id,
                    loanDetails,
                    status: "SANCTIONED",
                    updatedAt: new Date(),
                  }
                },
                {
                  new: true,
                  upsert: true,
                  setDefaultsOnInsert: true
                }
              );
      
              await Transaction.findOneAndUpdate(
                { transactionId },
                { status: "LOAN_SANCTIONED" },
                { new: true }
              );
            }
          }
          
          // Check if xinput form exists
          if (!order.items?.[0]?.xinput?.form?.id || !order.items?.[0]?.xinput?.form_response) {
            return res.status(200).json({
              message: "Status processed successfully - no form processing required",
            });
          }
          
          const formId = order.items[0].xinput.form.id;
          const formResponse = order.items[0].xinput.form_response;
          const providerId = order.provider.id;
          
          // Define approved statuses for consistency
          const APPROVED_STATUSES = ["APPROVED", "SUCCESS"];
          const isApproved = APPROVED_STATUSES.includes(formResponse.status);
          
          // Find and process SelectThree record
          const selectThree = await SelectThree.findOne({
            transactionId,
            formId,
          });
      
          if (selectThree) {
            // Update KYC status
            await SelectThree.findByIdAndUpdate(selectThree._id, {
              kycStatus: formResponse.status,
              kycSubmissionId: formResponse.submission_id,
            });
            
            await KycStatus.create({
              transactionId,
              providerId,
              formId,
              kycStatus: formResponse.status,
              submissionId: formResponse.submission_id,
              statusResponse: req.body,
            });
      
            // If KYC approved, make init call
            if (isApproved) {
              try {
                const initPayload = await InitRequestUtils.createInitOnePayload(
                  selectThree,
                  formResponse.submission_id
                );
                
                const initResponse = await InitService.makeInitRequest(initPayload);
                
                await InitOne.create({
                  transactionId,
                  providerId,
                  initPayload,
                  initResponse,
                  status: "INITIATED",
                  kycSubmissionId: formResponse.submission_id,
                  responseTimestamp: new Date(),
                });
                
                await Transaction.findOneAndUpdate(
                  { transactionId },
                  { status: "INITONE_INITIATED" },
                  { new: true }
                );
              } catch (initError) {
                console.error("Error in InitOne process:", initError);
                // Continue processing rather than failing the entire request
              }
            }
          }
      
          // Find and process InitTwo record
          const initTwo = await InitTwo.findOne({
            transactionId,
            emandateformId: formId,
          });
      
          if (initTwo) {
            await InitTwo.findByIdAndUpdate(initTwo._id, {
              emandateStatus: formResponse.status,
              emandateSubmissionId: formResponse.submission_id,
            });
            
            await EMandate.create({
              transactionId,
              providerId,
              formId,
              formUrl: order.items[0].xinput.form.url,
              mandateStatus: formResponse.status,
              submissionId: formResponse.submission_id,
              statusResponse: req.body,
            });
            
            if (isApproved) {
              try {
                const initThreePayload = await InitRequestUtils.createInitThreePayload(
                  initTwo,
                  formResponse.submission_id,
                  formId
                );
                
                const initResponse = await InitService.makeInitRequest(initThreePayload);
      
                await InitThree.create({
                  transactionId,
                  providerId,
                  initPayload: initThreePayload,
                  initResponse,
                  status: "INITIATED",
                  emandateSubmissionId: formResponse.submission_id,
                  responseTimestamp: new Date(),
                });
      
                await Transaction.findOneAndUpdate(
                  { transactionId },
                  { status: "INITTHREE_INITIATED" },
                  { new: true }
                );
              } catch (initError) {
                console.error("Error in InitThree process:", initError);
                // Continue processing rather than failing the entire request
              }
            }
          }
      
          // Find and process InitThree record
          const initThree = await InitThree.findOne({
            transactionId,
            documentformId: formId,
          });
      
          if (initThree) {
            await InitThree.findByIdAndUpdate(initThree._id, {
              documentStatus: formResponse.status,
              documentSubmissionId: formResponse.submission_id,
            });
      
            await Document.create({
              transactionId,
              providerId,
              formId,
              formUrl: order.items[0].xinput.form.url,
              documentStatus: formResponse.status,
              submissionId: formResponse.submission_id,
              statusResponse: req.body,
            });
      
            if (formResponse.status === "APPROVED") {
              await Transaction.findOneAndUpdate(
                { transactionId },
                { status: "INITTHREE_COMPLETED" },
                { new: true }
              );
            }
          }
      
          // Save status response with proper validation
          await Status.create({
            transactionId,
            providerId,
            bppId: context.bpp_id,
            formId: order.items[0].xinput.form.id,
            formResponse: order.items[0].xinput.form_response,
            loanDetails: {
              amount: order.items[0]?.price?.value,
              term: order.items[0]?.tags?.[0]?.list?.find(
                (i) => i.descriptor?.code === "TERM"
              )?.value,
              interestRate: order.items[0]?.tags?.[0]?.list?.find(
                (i) => i.descriptor?.code === "INTEREST_RATE"
              )?.value,
              installmentAmount: order.items[0]?.tags?.[0]?.list?.find(
                (i) => i.descriptor?.code === "INSTALLMENT_AMOUNT"
              )?.value,
            },
            paymentSchedule:
              order.payments && Array.isArray(order.payments)
                ? order.payments
                    .filter((p) => p && p.type === "POST_FULFILLMENT")
                    .map((p) => ({
                      installmentId: p.id,
                      amount: p.params?.amount,
                      dueDate: p.time?.range?.end,
                      status: p.status,
                    }))
                : [],
            statusResponse: req.body,
          });
      
          res.status(200).json({
            message: "Status processed successfully",
            isApproved,
          });
        } catch (error) {
          console.error("Status processing failed:", error);
          res.status(500).json({ error: error.message });
        }
      }
  static async getNoFormStatus(req, res) {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          error: "Transaction ID is required",
        });
      }

      const noFormStatus = await NoFormStatus.findOne({ transactionId });

      if (!noFormStatus) {
        return res.status(404).json({
          error: "No status found for this transaction",
        });
      }

      res.status(200).json({
        status: noFormStatus.statusPayload,
      });
    } catch (error) {
      console.error("Error fetching non-form status:", error);
      res.status(500).json({ error: error.message });
    }
  }
  static async checkLoanStatus(req, res) {
    try {
      const { userId } = req.body;
  
      // Fetch all transactions for the user
      const transactions = await Transaction.find({
        user: userId,
      });
  
      if (!transactions.length) {
        return res.status(404).json({
          message: "No transactions found for this user",
        });
      }
  
      // Track transactions in both collections and those only in transactions
      const validTransactions = [];
      const rejectedTransactions = [];
  
      // Check which transactions exist in DisbursedLoans
      for (const transaction of transactions) {
        const loan = await DisbursedLoan.findOne({
          transactionId: transaction.transactionId,
        });
  
        if (loan && loan.Response) {
          // Transaction exists in both collections
          validTransactions.push({
            transaction,
            loan
          });
        } else {
          // Transaction exists only in Transaction collection
          rejectedTransactions.push(transaction);
        }
      }
  
      if (!validTransactions.length) {
        return res.status(404).json({
          message: "No disbursed loans found that match transactions",
          rejectedTransactions: rejectedTransactions.map(t => t.transactionId)
        });
      }
  
      // Send status requests only for valid transactions
      await Promise.all(
        validTransactions.map(async ({ transaction, loan }) => {
          const { context } = loan.Response;
  
          const statusPayload = {
            context: {
              ...context,
              action: "status",
              message_id: uuidv4(),
              timestamp: new Date().toISOString(),
            },
            message: {
              ref_id: transaction.transactionId,
            },
          };
  
          const resss = await statusRequest(statusPayload);
          console.log("woowww", resss);
        })
      );
  
      // Wait for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
  
      // Fetch updated loan details
      const updatedLoans = await Promise.all(
        validTransactions.map(async ({ transaction }) => {
          const loan = await DisbursedLoan.findOne({
            transactionId: transaction.transactionId,
          });
  
          if (!loan) return null;
  
          return {
            transactionId: transaction.transactionId,
            response: loan.Response
          };
        })
      );
  
      const finalLoans = updatedLoans.filter((loan) => loan !== null);
      
      res.status(200).json({
        message: "Loan status check completed",
        totalLoans: finalLoans.length,
        rejectedTransactions: rejectedTransactions.length > 0 ? 
          rejectedTransactions.map(t => t.transactionId) : [],
        loans: finalLoans,
      });
    } catch (error) {
      console.error("Loan status check failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
  static async checkDisbursalStatus(req, res) {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        const disbursedLoan = await DisbursedLoan.findOne({ transactionId });

        if (!disbursedLoan) {
            return res.status(404).json({
                message: "No disbursed loan found for this transaction"
            });
        }

        res.status(200).json({
            message: "Done",
            loan: disbursedLoan.Response
        });

    } catch (error) {
        console.error("Disbursal status check failed:", error);
        res.status(500).json({ error: error.message });
    }
}
static async checkCompletedLoan(req, res) {
  try {
      const { transactionId } = req.body;

      if (!transactionId) {
          return res.status(400).json({
              message: "Transaction ID is required"
          });
      }

      const completedLoan = await CompletedLoan.findOne({ transactionId });

      if (!completedLoan) {
          return res.status(404).json({
              message: "No completed loan found for this transaction"
          });
      }

      res.status(200).json({
          message: "Completed loan found",
          loan: completedLoan.Response
      });

  } catch (error) {
      console.error("Completed loan check failed:", error);
      res.status(500).json({ error: error.message });
  }
}


}

module.exports = StatusController;
