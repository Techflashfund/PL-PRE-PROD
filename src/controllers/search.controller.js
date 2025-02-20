const SearchService = require('../services/search.services');
const Transaction = require('../models/transaction.model');
const FormDetails = require('../models/formdetails.model');
const { generateSearchRequestBody } = require('../utils/search.request.utils');
const { v4: uuidv4 } = require('uuid');
const { searchRequest } = require('../services/search.services');
const { submitToExternalForm } = require('../services/formsubmission.services');

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
             console.log('hii');


            //  Gateway search request
             const response = await searchRequest(requestBody)
             
            
            // Save transaction
            await Transaction.create({
                transactionId,
                messageId,
                user:userId,
                requestBody
            });
            res.json(response);

        } catch (error) {
            console.error('Search request failed:', error);
            res.status(500).json({ error: error});
        }
    }
    static async onSearch(req, res) {
        console.log('ONDC Response Received');
        
        try {
            const { context, message } = req.body;
            
            if (!context?.transaction_id || !message?.catalog?.providers?.[0]) {
                return res.status(400).json({ error: 'Invalid ONDC response format' });
            }

            const provider = message.catalog.providers[0];
            const formData = provider.items?.[0]?.xinput?.form;
            const loanDetails = provider.items?.[0]?.tags?.[0]?.list;

            if (!formData) {
                return res.status(400).json({ error: 'Form details not found' });
            }

            // Find transaction
            const transaction = await Transaction.findOne({ 
                transactionId: context.transaction_id 
            });

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
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

            // Update transaction
            await Transaction.findByIdAndUpdate(transaction._id, {
                formDetails: formDetails._id,
                status: 'COMPLETED',
                ondcResponse: req.body,
                responseTimestamp: new Date()
            });

            const formresponse=await submitToExternalForm(transaction.user,context.transaction_id)

            res.status(200).json({
                message: 'Response processed successfully',
                formresponse
            });

        } catch (error) {
            console.error('Search response processing failed:', error);
            res.status(500).json({ error: error.message });
        }
       }
}

module.exports = SearchController;