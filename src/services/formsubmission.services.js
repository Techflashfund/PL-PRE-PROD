const axios = require('axios');
const FormData = require('form-data');
const UserDetails = require('../models/userdetails.model');
const Transaction = require('../models/transaction.model');

class FormSubmissionService {
    static async submitToExternalForm(userId, transactionId) {
        try {
            // 1. Get user details
            const userDetails = await UserDetails.findOne({ user: userId });
            if (!userDetails) {
                throw new Error('User details not found');
            }

            // 2. Get form URL from transaction
            const transaction = await Transaction.findOne({ transactionId })
                .populate('formDetails');
            
            if (!transaction?.formDetails?.formUrl) {
                throw new Error('Form URL not found');
            }

            // 3. Create FormData
            const formData = new FormData();
            formData.append('firstName', userDetails.firstName);
            formData.append('lastName', userDetails.lastName);
            formData.append('email', userDetails.email);
            formData.append('dob', userDetails.dob.toISOString().split('T')[0]);
            formData.append('pan', userDetails.pan);
            formData.append('contactNumber', userDetails.contactNumber);
            formData.append('employmentType', userDetails.employmentType);
            formData.append('income', userDetails.income);
            formData.append('companyName', userDetails.companyName);
            formData.append('officialemail', userDetails.officialEmail);
            formData.append('gender', userDetails.gender);
            formData.append('udyamNumber', userDetails.udyamNumber || '');
            formData.append('addressL1', userDetails.address.line1);
            formData.append('addressL2', userDetails.address.line2 || '');
            formData.append('city', userDetails.address.city);
            formData.append('state', userDetails.address.state);
            formData.append('pincode', userDetails.address.pincode);
            formData.append('aa_id', userDetails.aa_id || '');
            formData.append('endUse', userDetails.endUse);
            formData.append('bureauConsent', userDetails.bureauConsent ? 'true' : 'false');

            // 4. Submit form
            const response = await axios.post(
                transaction.formDetails.formUrl,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Accept': 'application/json'
                    }
                }
            );

            // 5. Update transaction
            await Transaction.findByIdAndUpdate(transaction._id, {
                status: 'FORM_SUBMITTED',
                formSubmissionId: response.data.submissionId || response.data.id,
                formSubmissionTimestamp: new Date()
            });

            return {
                success: true,
                submissionId: response.data.submissionId || response.data.id,
                response: response.data
            };

        } catch (error) {
            console.error('Form submission error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Form submission failed: ${error.message}`);
        }
    }
}

module.exports = FormSubmissionService;