const InitOne = require("../models/initone.model");
const InitTwo = require("../models/inittwo.nodel");
const InitThree=require('../models/initthree.model')
const InitService = require("../services/init.services");
const InitRequestUtils = require("../utils/init.request.utils");
const Transaction = require("../models/transaction.model");
const BankDetails = require("../models/bankdetails.model");
const axios = require("axios");

class InitHelper {
  static async handleTypeOne(payload) {
    const { context, message } = payload;
    
    let formUrl = message?.order?.items?.[0]?.xinput?.form?.url;
    const formId = message?.order?.items?.[0]?.xinput?.form?.id;

    if (!formUrl || !formId || !message?.order?.provider?.id) {
        return { success: false, error: "NACK" };
    }

    try {
        // Transform GET URL to POST if needed
        if (formUrl.includes("/get")) {
            formUrl = formUrl.replace("/get", "/post");
        }

        // Fetch transaction to get userId
        const transaction = await Transaction.findOne({
            transactionId: context.transaction_id,
        });

        if (!transaction) {
            return { success: false, error: "NACK" };
        }

        // Get bank details for the user
        const bankDetails = await BankDetails.findOne({
            user: transaction.user,
        });

        if (!bankDetails) {
            return { success: false, error: "NACK" };
        }

        // Prepare form data
        const formData = {
            accHolderName: bankDetails.accountHolderName,
            acctype: bankDetails.accountType === "savings" ? "saving" : "current",
            accNo: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            formId: formId,
        };

        // Submit the form
        const response = await axios.post(formUrl, formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const submissionId = response.data.submission_id;

        if (!submissionId) {
            return { success: false, error: "NACK" };
        }

        // Update InitOne with form submission details
        await InitOne.findOneAndUpdate(
            {
                transactionId: context.transaction_id,
                providerId: message.order.provider.id,
            },
            {
                $set: {
                    status: "COMPLETED",
                    responseTimestamp: new Date(),
                    initonerequest: payload,
                    bankformurl: formUrl,
                    bankformId: formId,
                    bankdetailsSubmissionId: submissionId,
                },
            }
        );

        const initone = await InitOne.findOne({
            transactionId: context.transaction_id,
            providerId: message.order.provider.id,
        });

        await Transaction.findOneAndUpdate(
            { transactionId: context.transaction_id },
            { status: "INITONE_COMPLETED" }
        );

        const initPayload = await InitRequestUtils.createInitTwoPayload(
            initone,
            submissionId,
            formId
        );
        const initResponse = await InitService.makeInitRequest(initPayload);

        await InitTwo.create({
            transactionId: initone.transactionId,
            providerId: initone.providerId,
            initPayload: initPayload,
            initResponse,
            status: "INITIATED",
            bankDetailsSubmissionId: submissionId,
            responseTimestamp: new Date(),
        });

        await Transaction.findOneAndUpdate(
            { transactionId: initone.transactionId },
            { status: "INITTWO_INITIATED" }
        );

        return {
            success: true,
            data: {
                context: payload.context,
                message: { ack: { status: "ACK" } },
            },
        };
    } catch (error) {
        console.error("Error in handleTypeOne:", error);

        // Update status to FAILED in case of error
        await InitOne.findOneAndUpdate(
            {
                transactionId: context.transaction_id,
                providerId: message.order.provider.id,
            },
            {
                $set: {
                    status: "FAILED",
                    responseTimestamp: new Date(),
                },
            }
        );

        return { success: false, error: "NACK" };
    }
}

static async handleTypeTwo(payload) {
  console.log('Processing handleTypeTwo...');

  const { context, message } = payload;
  
  // Validate input data
  const formUrl = message?.order?.items?.[0]?.xinput?.form?.url;
  const formId = message?.order?.items?.[0]?.xinput?.form?.id;
  const providerId = message?.order?.provider?.id;

  if (!formUrl || !formId || !providerId) {
      return { success: false, error: "NACK" };
  }

  try {
      // Update InitTwo with eMandate form details
      await InitTwo.findOneAndUpdate(
          { transactionId: context.transaction_id, providerId },
          {
              $set: {
                  status: "COMPLETED",
                  responseTimestamp: new Date(),
                  inittworequest: payload,
                  emandateformurl: formUrl,
                  emandateformId: formId,
              },
          }
      );

      // Update transaction status
      await Transaction.findOneAndUpdate(
          { transactionId: context.transaction_id },
          { status: "INITTWO_COMPLETED" }
      );

      return {
          success: true,
          data: {
              context: payload.context,
              message: { ack: { status: "ACK" } },
              formUrl,
              formId
          },
      };
  } catch (error) {
      console.error("Error in handleTypeTwo:", error);

      // Update status to FAILED in case of error
      await InitTwo.findOneAndUpdate(
          { transactionId: context.transaction_id, providerId },
          {
              $set: {
                  status: "FAILED",
                  responseTimestamp: new Date(),
              },
          }
      );

      return { success: false, error: "NACK" };
  }
}

static async handleTypeThree(payload) {
  console.log('Processing handleTypeThree...');

  const { context, message } = payload;

  // Validate required fields
  const formUrl = message?.order?.items?.[0]?.xinput?.form?.url;
  const formId = message?.order?.items?.[0]?.xinput?.form?.id;
  const providerId = message?.order?.provider?.id;

  if (!formUrl || !formId || !providerId) {
      return { success: false, error: "NACK - Missing required fields" };
  }

  try {
      // Update InitThree with loan agreement form details
      await InitThree.findOneAndUpdate(
          {
              transactionId: context.transaction_id,
              providerId
          },
          {
              $set: {
                  status: "COMPLETED",
                  responseTimestamp: new Date(),
                  initthreeresponse: payload,
                  documentformurl: formUrl,
                  documentformId: formId
              }
          }
      );

      // Update Transaction status
      await Transaction.findOneAndUpdate(
          { transactionId: context.transaction_id },
          { status: "INITTHREE_COMPLETED" }
      );

      return {
          success: true,
          data: {
              context: payload.context,
              message: { ack: { status: "ACK" } },
              
          }
      };

  } catch (error) {
      console.error('Error in handleTypeThree:', error);

      // Update status to FAILED in case of error
      await InitThree.findOneAndUpdate(
          {
              transactionId: context.transaction_id,
              providerId
          },
          {
              $set: {
                  status: "FAILED",
                  responseTimestamp: new Date()
              }
          }
      );

      return { success: false, error: "NACK - Internal Server Error" };
  }
}

}

module.exports = InitHelper;
