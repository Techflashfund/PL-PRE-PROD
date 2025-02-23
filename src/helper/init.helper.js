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
    let formUrl = payload.message.order.items[0].xinput.form.url;
    const formId = payload.message.order.items[0].xinput.form.id;

    try {
      // Transform GET URL to POST if needed
      if (formUrl.includes("/get")) {
        formUrl = formUrl.replace("/get", "/post");
      }

      // First find the transaction to get userId
      const transaction = await Transaction.findOne({
        transactionId: context.transaction_id,
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Get bank details for the user
      const bankDetails = await BankDetails.findOne({
        user: transaction.user,
      });

      if (!bankDetails) {
        throw new Error("Bank details not found for user");
      }

      // Prepare form data matching the form structure
      const formData = {
        accHolderName: bankDetails.accountHolderName,
        acctype: bankDetails.accountType === "savings" ? "saving" : "current", // Map to form values
        accNo: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        formId: formId,
      };

      // Submit the form
      const response = await axios.post(formUrl, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Assuming the response includes a submissionId
      const submissionId = response.data.submission_id;

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

      // Update Transaction status
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
      console.log('----------------------------------------------');
      
      await Transaction.findOneAndUpdate(
        { transactionId: initone.transactionId },
        { status: "INITTWO_INITIATED" }
      );
      console.log('++++++++++++++++++++++++++++++++++++++++++');
      return submissionId;
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

      throw error;
    }
  }
  static async handleTypeTwo(payload) {
    console.log('poli polidmkdn');
    
    const { context, message } = payload;
    const formUrl = payload.message.order.items[0].xinput.form.url;
    const formId = payload.message.order.items[0].xinput.form.id;
    try {
      await InitTwo.findOneAndUpdate(
        {
          transactionId: context.transaction_id,
          providerId: message.order.provider.id,
        },
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
      await Transaction.findOneAndUpdate(
        { transactionId: context.transaction_id },
        { status: "INITTWO_COMPLETED" }
      );
      return {
        formUrl,
        formId,
      };
    } catch (error) {
      console.error("Error in handleTypeTwo:", error);
      await InitTwo.findOneAndUpdate(
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
      throw error;
    }
  }
  static async handleTypeThree(payload) {
    const { context, message } = payload;
    const formUrl = message.order.items[0].xinput.form.url;
    const formId = message.order.items[0].xinput.form.id;

    try {
        // Update InitThree with loan agreement form details
        await InitThree.findOneAndUpdate(
            {
                transactionId: context.transaction_id,
                providerId: message.order.provider.id,
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
            formUrl,
            formId
        };

    } catch (error) {
        console.error('Error in handleTypeThree:', error);
        await InitThree.findOneAndUpdate(
            {
                transactionId: context.transaction_id,
                providerId: message.order.provider.id,
            },
            {
                $set: {
                    status: "FAILED",
                    responseTimestamp: new Date()
                }
            }
        );
        throw error;
    }
}
}

module.exports = InitHelper;
