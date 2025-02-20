const SearchService = require('../services/search.services');
const Transaction = require('../models/transaction.model');
const { generateSearchRequestBody } = require('../utils/search.request.utils');
const { v4: uuidv4 } = require('uuid');
const { searchRequest } = require('./lit.controllers');

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

             const response = await searchRequest(requestBody,userId)
             
            // const response = await SearchService.makeSearchRequest(requestBody);
            // Save transaction
            // await Transaction.create({
            //     transactionId,
            //     messageId,
            //     userId,
            //     requestBody
            // });
            res.json(response);

        } catch (error) {
            console.error('Search request failed:', error);
            res.status(500).json({ error: error});
        }
    }
    static async onSearch(req, res) {
        try {
            const { context, message } = req.body;
            
            // Validate ONDC response
            if (!context || !context.transaction_id || !message) {
                return res.status(400).json({ error: 'Invalid ONDC response format' });
            }

            // Update transaction with ONDC response
            await Transaction.findOneAndUpdate(
                { transactionId: context.transaction_id },
                { 
                    $set: {
                        status: 'COMPLETED',
                        ondcResponse: req.body,
                        responseTimestamp: new Date()
                    }
                }
            );

            res.status(200).json({ message: 'Response processed successfully' });
        } catch (error) {
            console.error('ONDC callback processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = SearchController;