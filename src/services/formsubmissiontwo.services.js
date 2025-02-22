const axios = require('axios');
const FormData = require('form-data');

class FormSubmissionServicetwo {
    static transformFormUrl(url) {
        if (url.includes('/get/')) {
            return url.replace('/get/', '/post/');
        }
        return url;
    }

    static async submitAmountForm(formUrl, data) {
        try {
            const url = this.transformFormUrl(formUrl);
            console.log('Submitting amount to URL:', url);

            const formData = new FormData();
            formData.append('requestAmount', data.amount);
            formData.append('formId', data.formId);

            const response = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Accept': 'application/json'
                }
            });

            console.log('Amount form submission response:', response.data);
            return response.data;

        } catch (error) {
            console.error('Amount form submission failed:', error);
            throw error;
        }
    }
}
module.exports = FormSubmissionServicetwo;