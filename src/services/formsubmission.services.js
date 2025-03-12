const FormData = require('form-data');
const axios = require('axios');
const UserDetails = require('../models/userdetails.model');
const Transaction = require('../models/transaction.model');
const url = require('url');

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
    
    // Check if the URL is for a domain that needs special handling
    static isDomainWithSpecialRequirements(formUrl) {
        try {
            const domain = new URL(formUrl).hostname;
            // List of domains that need special handling
            const specialDomains = [
                'dmi-ondcpreprod.refo.dev',
                'refo.dev'
            ];
            
            return specialDomains.some(d => domain.includes(d));
        } catch (e) {
            return false;
        }
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

            // Determine if this domain needs special handling
            const isSpecialDomain = FormSubmissionService.isDomainWithSpecialRequirements(orgformUrl);
            console.log(`Domain requires special handling: ${isSpecialDomain}`);

            // 3. Validate required fields
            const requiredFields = [
                'firstName', 'lastName', 'email', 'dob', 'pan', 
                'contactNumber', 'employmentType', 'income', 'companyName', 'bureauConsent'
            ];

            const missingFields = requiredFields.filter(field => {
                if (field === 'email' && userDetails['email']) return false;
                return !userDetails[field];
            });
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // 4. Create FormData with fields
            const formData = new FormData();
            
            // Prepare the data fields based on domain
            let fieldMapping = {};
            
            if (isSpecialDomain) {
                // Special handling for problematic domains
                fieldMapping = {
                    firstName: userDetails.firstName,
                    lastName: userDetails.lastName,
                    // Use only the personalemail field for special domains
                    personalemail: userDetails.email,
                    dob: userDetails.dob?.toISOString().split('T')[0],
                    pan: userDetails.pan,
                    contactNumber: userDetails.contactNumber,
                    employmentType: userDetails.employmentType,
                    income: userDetails.income?.toString() || '0',
                    companyName: userDetails.companyName,
                    officialemail: userDetails.officialEmail || '',
                    gender: userDetails.gender || 'male',
                    udyamNumber: userDetails.udyamNumber || '',
                    addressL1: userDetails.address?.line1 || '',
                    addressL2: userDetails.address?.line2 || '',
                    city: userDetails.address?.city || '',
                    state: userDetails.address?.state || '',
                    pincode: userDetails.address?.pincode || '',
                    // aa_id: userDetails.aa_id || '',
                    endUse: userDetails.endUse || 'other',
                    // Use proper boolean string for special domains
                    bureauConsent: userDetails.bureauConsent ? 'true' : 'false'
                };
            } else {
                // Standard handling for other domains
                fieldMapping = {
                    firstName: userDetails.firstName,
                    lastName: userDetails.lastName,
                    personalemail: userDetails.email,
                    email: userDetails.email,
                    dob: userDetails.dob?.toISOString().split('T')[0],
                    pan: userDetails.pan,
                    contactNumber: userDetails.contactNumber,
                    employmentType: userDetails.employmentType,
                    income: userDetails.income?.toString() || '0',
                    companyName: userDetails.companyName,
                    officialemail: userDetails.officialEmail || '',
                    gender: userDetails.gender || 'male',
                    udyamNumber: userDetails.udyamNumber || '',
                    addressL1: userDetails.address?.line1 || '',
                    addressL2: userDetails.address?.line2 || '',
                    city: userDetails.address?.city || '',
                    state: userDetails.address?.state || '',
                    pincode: userDetails.address?.pincode || '',
                    // aa_id: userDetails.aa_id || '',
                    endUse: userDetails.endUse || 'other',
                    bureauConsent: userDetails.bureauConsent ? 'on' : '',
                    bureauConsent_true: userDetails.bureauConsent ? 'true' : 'false'
                };
            }
            
            // Add all fields to form data
            Object.entries(fieldMapping).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                    console.log(`Appending ${key}:`, value);
                }
            });

            console.log('Form URL:', orgformUrl);

            // Set up headers based on domain
            let headers = {
                ...formData.getHeaders(),
                'Accept': 'application/json, text/html, */*',
                'Origin': new URL(orgformUrl).origin,
                'Referer': orgformUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            };
            
            // Special domain may need additional headers
            if (isSpecialDomain) {
                headers = {
                    ...headers,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'multipart/form-data'
                };
            }

            // 5. Submit form with improved headers
            const response = await axios.post(
                orgformUrl,
                formData,
                {
                    headers,
                    maxRedirects: 5,
                    validateStatus: status => status < 500,
                    timeout: 30000 // Increase timeout for slow servers
                }
            );

            console.log('Form submission response:', response.data);

            // Special handling for DOMAIN-ERROR responses
            if (response.data && 
                response.data.error && 
                response.data.error.type === 'DOMAIN-ERROR') {
                
                // Log detailed error info
                console.error('Domain Error Details:', {
                    type: response.data.error.type,
                    code: response.data.error.code,
                    message: response.data.error.message
                });
                
                // Special handling for code 80215
                if (response.data.error.code === '80215') {
                    console.log('Attempting special workaround for error 80215...');
                    
                    // Try with a direct POST and different content type
                    const urlObj = new URL(orgformUrl);
                    
                    // Create a URL-encoded form data instead
                    const params = new URLSearchParams();
                    Object.entries(fieldMapping).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            params.append(key, value);
                        }
                    });
                    
                    // Try alternative submission method
                    const retryResponse = await axios.post(
                        orgformUrl,
                        params,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept': 'application/json, text/html, */*',
                                'Origin': urlObj.origin,
                                'Referer': orgformUrl,
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            maxRedirects: 5,
                            validateStatus: status => status < 500
                        }
                    );
                    
                    console.log('Retry response:', retryResponse.data);
                    
                    // Use the retry response instead
                    return {
                        success: true,
                        formUrl: orgformUrl,
                        submissionId: retryResponse.data.submission_id,
                        response: retryResponse.data
                    };
                }
            }

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
            
            throw error;
        }
    }
}

module.exports = FormSubmissionService;