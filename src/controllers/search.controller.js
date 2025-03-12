const SearchService = require('../services/search.services');
const Transaction = require('../models/transaction.model');
const FormDetails = require('../models/formdetails.model');
const { generateSearchRequestBody } = require('../utils/search.request.utils');
const { v4: uuidv4 } = require('uuid');
const { searchRequest } = require('../services/search.services');
const { submitToExternalForm } = require('../services/formsubmission.services');
const SelectRequestHandler = require('../services/select.services');
const SelectPayloadHandler = require('../utils/select.request.utils');
const SelectTwo = require('../models/selecttwo.model');
const SearchIds = require('../models/searchids.model');
const SelectIds = require('../models/selectids.model');
class SearchController {
    static async searchRequest(req, res) {
        try {
            const { userId } = req.body;
            const transactionId = uuidv4();
            const messageId = uuidv4();
            
            const requestBody = generateSearchRequestBody({
                transactionId,
                messageId
            });
            
            const response = await searchRequest(requestBody)
            
            await Transaction.create({
                transactionId,
                messageId,
                user: userId,
                requestBody
            });
            await SearchIds.create({
                transactionId,
                messageId,
                type: 'SEARCH'
            });
            
            res.json(response);
        } catch (error) {
            console.error('Search request failed:', error);
            res.status(500).json({ error: error });
        }
    }

    static async onSearch(req, res) {
    try {
        // Version check
        const version = req.body.context?.version;
        if (version !== "2.0.1") {
            return res.status(400).json({ success: false, error: "NACK" });
        }

        console.log('ONDC Response Received');
        
        const { context, message } = req.body;
        
        if (!context?.transaction_id || !message?.catalog?.providers?.[0]) {
            return res.status(400).json({ success: false, error: "NACK" });
        }

        const provider = message.catalog.providers[0];
        const formData = provider.items?.[0]?.xinput?.form;
        const loanDetails = provider.items?.[0]?.tags?.[0]?.list;

        if (!formData) {
            return res.status(400).json({ success: false, error: "NACK" });
        }

        // Find transaction
        const transaction = await Transaction.findOne({ 
            transactionId: context.transaction_id 
        });

        console.log('Transaction:', transaction);

        if (!transaction) {
            return res.status(404).json({ success: false, error: "NACK" });
        }

        // Create form details
        const formDetails = await FormDetails.create({
            transaction: transaction._id,
            formId: formData.id,
            formUrl: formData.url,
            mimeType: formData.mime_type,
            resubmit: formData.resubmit,
            multipleSubmissions: formData.multiple_submissions,
            providerName: provider.descriptor?.name,
            providerDescription: provider.descriptor?.long_desc,
            minLoanAmount: loanDetails?.find(item => item.descriptor?.code === 'MIN_LOAN_AMOUNT')?.value,
            maxLoanAmount: loanDetails?.find(item => item.descriptor?.code === 'MAX_LOAN_AMOUNT')?.value,
            minInterestRate: loanDetails?.find(item => item.descriptor?.code === 'MIN_INTEREST_RATE')?.value,
            maxInterestRate: loanDetails?.find(item => item.descriptor?.code === 'MAX_INTEREST_RATE')?.value,
            minTenure: loanDetails?.find(item => item.descriptor?.code === 'MIN_TENURE')?.value,
            maxTenure: loanDetails?.find(item => item.descriptor?.code === 'MAX_TENURE')?.value
        });

        const searchResponse = {
            response: req.body,
            providerId: provider.id,
            providerName: provider.descriptor?.name,
            formDetails: formDetails._id,
            responseTimestamp: new Date()
        };

        await Transaction.findByIdAndUpdate(
            transaction._id,
            {
                $push: { ondcSearchResponses: searchResponse },
                status: 'COMPLETED'
            },
            { new: true }
        );

        const formresponse = await submitToExternalForm(transaction.user, context.transaction_id, formData.url);
        console.log('Form submission response:', formresponse.formUrl, formresponse.submissionId);
        console.log('Form submission response:', formresponse.response.message);
        
        if (!formresponse.submissionId) {
            return res.status(500).json({ success: false, error: "NACK" });
        }

        await Transaction.findOneAndUpdate(
            { 
                transactionId: context.transaction_id,
                'ondcSearchResponses.providerId': provider.id 
            },
            {
                $set: {
                    'ondcSearchResponses.$.formSubmissionId': formresponse.submissionId
                }
            }
        );

        const selectPayload = await SelectPayloadHandler.createSelectonePayload(req.body, formresponse.submissionId);
        const selectResponse = await SelectRequestHandler.selectRequest(selectPayload);
        await SelectIds.create({
            transactionId: context.transaction_id,
            messageId: selectPayload.context.message_id,
            type: 'SELECT_2',
        });
        await SelectTwo.create({
                        transactionId: payload.context.transaction_id,
                        providerId: payload.message.order.provider.id,
                        selectPayload,
                        selectResponse,
                        status: 'INITIATED'
                    });
        await Transaction.findByIdAndUpdate(
            transaction._id,
            { status: 'SELECTONE_INITIATED' }
        );

        return res.status(200).json({
            success: true,
            data: {
                context,
                message: { ack: { status: "ACK" } }
            }
        });

    } catch (error) {
        console.error('Search response processing failed:', error);
        return res.status(500).json({ success: false, error: "NACK" });
    }
}

}

module.exports = SearchController;