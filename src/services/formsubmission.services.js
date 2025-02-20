const FormData = require('form-data');
const axios = require('axios');
const UserDetails = require('../models/userdetails.model');
const Transaction = require('../models/transaction.model');

class FormSubmissionService {
    static transformFormUrl(url) {
        console.log('Original Form URL:', url);
        
        if (url.includes('/get/')) {
            const newUrl = url.replace('/get/', '/post/');
            console.log('Transformed to POST URL:', newUrl);
            return newUrl;
        }
        
        return url;
    }
    static async submitToExternalForm(userId, transactionId) {
        try {
            console.log('Starting form submission with:', { userId, transactionId });

            // 1. Get user details with logging
            const userDetails = await UserDetails.findOne({ user: userId });
            console.log('User Details found:', userDetails ? 'Yes' : 'No');
            
            if (!userDetails) {
                throw new Error(`User details not found for userId: ${userId}`);
            }

            // 2. Get transaction with logging
            const transaction = await Transaction.findOne({ transactionId })
                .populate('formDetails');
            console.log('Transaction found:', transaction ? 'Yes' : 'No');
            console.log('Form Details:', transaction?.formDetails);

            if (!transaction?.formDetails?.formUrl) {
                throw new Error(`Form URL not found for transactionId: ${transactionId}`);
            }

             // Transform URL if needed
            const formUrl = FormSubmissionService.transformFormUrl(transaction.formDetails.formUrl);
            console.log('Form URL after transformation:', formUrl);

            // 3. Validate required fields
            const requiredFields = [
                'firstName', 'lastName', 'email', 'dob', 'pan', 
                'contactNumber', 'employmentType'
            ];

            const missingFields = requiredFields.filter(field => !userDetails[field]);
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // 4. Create FormData with validation
            const formData = new FormData();
            Object.entries({
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                email: userDetails.email,
                dob: userDetails.dob?.toISOString().split('T')[0],
                pan: userDetails.pan,
                contactNumber: userDetails.contactNumber,
                employmentType: userDetails.employmentType,
                income: userDetails.income,
                companyName: userDetails.companyName,
                officialemail: userDetails.officialEmail || '',
                gender: userDetails.gender,
                udyamNumber: userDetails.udyamNumber || '',
                addressL1: userDetails.address?.line1 || '',
                addressL2: userDetails.address?.line2 || '',
                city: userDetails.address?.city || '',
                state: userDetails.address?.state || '',
                pincode: userDetails.address?.pincode || '',
                aa_id: userDetails.aa_id || '',
                endUse: userDetails.endUse || 'other',
                bureauConsent: userDetails.bureauConsent ? 'true' : 'false'
            }).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
                console.log(`Appending ${key}:`, value);
            });

            console.log('Form URL:', transaction.formDetails.formUrl);

            // 5. Submit form
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

            console.log('Form submission response:', response.data);

            return {
                success: true,
                formUrl: transaction.formDetails.formUrl,
                submissionId: response.data.submissionId || response.data.id,
                response: response.data
            };

        } catch (error) {
            console.error('Form Submission Error:', {
                error: error.message,
                stack: error.stack,
                userData: userId,
                transactionId: transactionId,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }
}

module.exports = FormSubmissionService;