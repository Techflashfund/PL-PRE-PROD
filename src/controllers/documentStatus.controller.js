const Document = require('../models/document.model');

class DocumentStatusController {
    static async getDocumentStatus(req, res) {
        try {
            const { transactionId, formId } = req.body;

            if (!transactionId || !formId) {
                return res.status(400).json({ 
                    error: 'Transaction ID and Form ID are required' 
                });
            }

            const documentStatus = await Document.findOne({ 
                transactionId,
                formId
            });

            if (!documentStatus) {
                return res.status(404).json({ 
                    error: 'Document status not found' 
                });
            }

            res.status(200).json({
                documentStatus: documentStatus.documentStatus === 'APPROVED' ? 'SUCCESS' : documentStatus.documentStatus,
                submissionId: documentStatus.submissionId,
                formId: documentStatus.formId,
                formUrl: documentStatus.formUrl,
                transactionId: documentStatus.transactionId,
                providerId: documentStatus.providerId
            });

        } catch (error) {
            console.error('Error fetching document status:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = DocumentStatusController;