const axios = require('axios');
const blake = require('blakejs');
const CONFIG = require('../config/search.config');
const CryptoUtils = require('../utils/crypto.utils');

class SearchService {
    static async makeSearchRequest(requestBody) {
        const hashedBody = blake.blake2bHex(Buffer.from(JSON.stringify(requestBody)));
        const base64HashedBody = Buffer.from(hashedBody, 'hex').toString('base64');
        const { authHeader } = CryptoUtils.generateAuthHeader(base64HashedBody);

        return axios.post(
            CONFIG.API_ENDPOINTS.SEARCH,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                }
            }
        );
    }
}

module.exports = SearchService;