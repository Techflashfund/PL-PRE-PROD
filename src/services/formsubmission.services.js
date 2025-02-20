const axios = require('axios');
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

            // 2. Get transaction for form URL
            const transaction = await Transaction.findOne({ transactionId })
                .populate('formDetails');
            
            if (!transaction?.formDetails?.formUrl) {
                throw new Error('Form URL not found');
            }

            // 3. Prepare form data
            const formData = {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                dob: userDetails.dob,
                gender: userDetails.gender,
                pan: userDetails.pan,
                contactNumber: userDetails.contactNumber,
                personalemail: userDetails.email,
                officialemail: userDetails.officialEmail,
                employmentType: userDetails.employmentType,
                endUse: userDetails.endUse,
                income: userDetails.income,
                companyName: userDetails.companyName,
                udyamNumber: userDetails.udyamNumber,
                addressL1: userDetails.address.line1,
                addressL2: userDetails.address.line2,
                city: userDetails.address.city,
                state: userDetails.address.state,
                pincode: userDetails.address.pincode,
                aa_id: userDetails.aa_id,
                bureauConsent: userDetails.bureauConsent
            };

            // 4. Submit form
            const response = await axios.post(
                transaction.formDetails.formUrl,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log('Form submission response:', response.data);
            

            // 5. Update transaction with submission ID
            await Transaction.findByIdAndUpdate(transaction._id, {
                status: 'FORM_SUBMITTED',
                formSubmissionId: response.data.submission_id,
                formSubmissionTimestamp: new Date()
            });

            return {
                success: true,
                submissionId: response.data.submissionId
            };

        } catch (error) {
            console.error('Form submission failed:', error);
            throw error;
        }
    }
}

module.exports = FormSubmissionService;