const InitThree = require('../models/initthree.model');

class DocumentController {
    static async getDocumentForm(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ 
                    error: 'Transaction ID is required' 
                });
            }

            const initThree = await InitThree.findOne({ 
                transactionId,
                documentformurl: { $exists: true }
            });

            if (!initThree) {
                return res.status(404).json({ 
                    error: 'Document form not found' 
                });
            }

            res.status(200).json({
                formUrl: initThree.documentformurl,
                formId: initThree.documentformId,
              
            });

        } catch (error) {
            console.error('Error fetching document form:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = DocumentController;