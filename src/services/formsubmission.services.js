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
        
        // Also handle /udform/ endpoints
        if (url.includes('/udform/') && !url.includes('method=post')) {
            // Make sure we're using the POST endpoint
            console.log('Using form POST URL:', url);
        }
        
        return url;
    }
    
    static async submitToExternalForm(userId, transactionId, formUrl) {
        try {
            console.log('Starting form submission with:', { userId, transactionId });

            // 1. Get user details with logging
            const userDetails = await UserDetails.findOne({ user: userId });
            console.log('User Details found:', userDetails ? 'Yes' : 'No');
            
            if (!userDetails) {
                throw new Error(`User details not found for userId: ${userId}`);
            }

            if (!formUrl) {
                throw new Error(`Form URL not found for transactionId: ${transactionId}`);
            }

            // Transform URL if needed
            const orgformUrl = FormSubmissionService.transformFormUrl(formUrl);
            console.log('Form URL after transformation:', orgformUrl);

            // 3. Validate required fields - updated to match HTML form required fields
            const requiredFields = [
                'firstName', 'lastName', 'email', 'dob', 'pan', 
                'contactNumber', 'employmentType', 'income', 'companyName', 'bureauConsent'
            ];

            const missingFields = requiredFields.filter(field => {
                // Special handling for email field which is named differently
                if (field === 'email' && userDetails['email']) return false;
                return !userDetails[field];
            });
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // 4. Create FormData with fields matching exactly the HTML form
            const formData = new FormData();
            
            // Map our backend fields to the form fields
            const fieldMapping = {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                // Include BOTH email field names to support different forms
                personalemail: userDetails.email,
                email: userDetails.email, // Include standard email field too
                dob: userDetails.dob?.toISOString().split('T')[0],
                pan: userDetails.pan,
                contactNumber: userDetails.contactNumber,
                employmentType: userDetails.employmentType,
                income: userDetails.income,
                companyName: userDetails.companyName,
                officialemail: userDetails.officialEmail || '',
                gender: userDetails.gender || 'male', // Default value if missing
                udyamNumber: userDetails.udyamNumber || '',
                addressL1: userDetails.address?.line1 || '',
                addressL2: userDetails.address?.line2 || '',
                city: userDetails.address?.city || '',
                state: userDetails.address?.state || '',
                pincode: userDetails.address?.pincode || '',
                aa_id: userDetails.aa_id || '',
                endUse: userDetails.endUse || 'other',
                // Include BOTH checkbox formats
                bureauConsent: userDetails.bureauConsent ? 'on' : '',
                bureauConsent_true: userDetails.bureauConsent ? 'true' : 'false'
            };
            
            // Add all fields to form data
            Object.entries(fieldMapping).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                    console.log(`Appending ${key}:`, value);
                }
            });

            console.log('Form URL:', orgformUrl);

            // 5. Submit form with improved headers
            const response = await axios.post(
                orgformUrl,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Accept': 'application/json, text/html, */*',
                        'Origin': new URL(orgformUrl).origin,
                        'Referer': orgformUrl,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    maxRedirects: 5, // Allow redirects
                    validateStatus: status => status < 500 // Accept any non-server error
                }
            );

            console.log('Form submission response:', response.data);

            // Handle successful responses in different formats
            let submissionId = null;
            if (typeof response.data === 'object') {
                submissionId = response.data.submission_id || response.data.id || 'success';
            } else {
                submissionId = 'success'; // For HTML responses
            }

            return {
                success: true,
                formUrl: orgformUrl,
                submissionId,
                response: response.data
            };

        } catch (error) {
            console.error('Form Submission Error:', {
                error: error.message,
                stack: error.stack,
                userData: userId,
                transactionId: transactionId,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            // More detailed error information
            if (error.response) {
                console.error('Response Error Details:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    headers: error.response.headers,
                    data: typeof error.response.data === 'string' && error.response.data.length > 1000 
                        ? error.response.data.substring(0, 1000) + '...' 
                        : error.response.data
                });
            }
            
            // Try to return a more informative error
            throw new Error(`Form submission failed: ${error.message}, Status: ${error.response?.status || 'Unknown'}`);
        }
    }
}

module.exports = FormSubmissionService;