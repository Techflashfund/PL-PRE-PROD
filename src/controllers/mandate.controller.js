const InitTwo = require('../models/inittwo.nodel');

class MandateController {
    static async getMandateForm(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ 
                    error: 'Transaction ID is required' 
                });
            }

            const initTwo = await InitTwo.findOne({ 
                transactionId,
                emandateformurl: { $exists: true }
            });

            if (!initTwo) {
                return res.status(404).json({ 
                    error: 'Mandate form not found' 
                });
            }

            res.status(200).json({
                formUrl: initTwo.emandateformurl,
                formId: initTwo.emandateformId
                
            });

        } catch (error) {
            console.error('Error fetching mandate form:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = MandateController;