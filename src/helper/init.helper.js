const InitOne = require('../models/initone.model');
const Transaction = require('../models/transaction.model');
const BankDetails = require('../models/bankdetails.model');
const axios = require('axios');

class InitHelper {
    static async handleTypeOne(payload) {
        const { context, message } = payload;
        let formUrl = payload.message.order.items[0].xinput.form.url;
        const formId = payload.message.order.items[0].xinput.form.id;

        try {
            // Transform GET URL to POST if needed
            if (formUrl.includes('/get')) {
                formUrl = formUrl.replace('/get', '/post');
            }

            // First find the transaction to get userId
            const transaction = await Transaction.findOne({ 
                transactionId: context.transaction_id 
            });

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Get bank details for the user
            const bankDetails = await BankDetails.findOne({ 
                user: transaction.user 
            });

            if (!bankDetails) {
                throw new Error('Bank details not found for user');
            }

            // Prepare form data matching the form structure
            const formData = {
                accHolderName: bankDetails.accountHolderName,
                acctype: bankDetails.accountType === 'savings' ? 'saving' : 'current', // Map to form values
                accNo: bankDetails.accountNumber,
                ifscCode: bankDetails.ifscCode,
                formId: formId
            };

            // Submit the form
            const response = await axios.post(formUrl, formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
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
                        bankdetailsSubmissionId: submissionId
                    },
                }
            );

            // Update Transaction status
            await Transaction.findOneAndUpdate(
                { transactionId: context.transaction_id },
                { status: "INITONE_COMPLETED" }
            );

            return submissionId;

        } catch (error) {
            console.error('Error in handleTypeOne:', error);
            
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
    static async handleTypeTwo(payload){
      return null
    }
    static async handleTypeThree(payload){
      return null
    }
}

module.exports = InitHelper;