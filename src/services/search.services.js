const axios = require('axios');
const nacl = require('tweetnacl');
const blake = require('blakejs');
const CONFIG=require('../config/search.config')

class SearchRequestHandler {
  

  static signMessage(message) {
    if (!message) {
      throw new Error('Message to sign cannot be empty');
    }

    if (!CONFIG.PRIVATE_KEY) {
      throw new Error('Private key is not configured');
    }

    try {
      const privateKey = Buffer.from(CONFIG.PRIVATE_KEY, 'base64');
      if (privateKey.length !== 64) {
        throw new Error('Invalid private key length');
      }

      const messageUint8Array = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageUint8Array, privateKey);
      return Buffer.from(signature).toString('base64');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  static generateAuthHeader(hashedBody) {
    if (!hashedBody) {
      throw new Error('Hashed body cannot be empty');
    }

    const created = Math.floor(Date.now() / 1000)-10000;
    const expires = Math.floor((Date.now() + CONFIG.SIGNATURE_VALIDITY) / 1000);
    
    const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${hashedBody}`;
    const signature = this.signMessage(signingString);

    return {
      authHeader: `Signature keyId="${CONFIG.KEY_ID}",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`,
      created,
      expires
    };
  }

  static async searchRequest(requestBody) {
    if (!requestBody ) {
      throw new Error('Missing required parameters: requestBody or userId');
    }

    try {
      // Validate context properties
      if (!requestBody.context || !requestBody.context.transaction_id || !requestBody.context.message_id) {
        throw new Error('Invalid request body: missing required context properties');
      }
    
     
      // Save transaction first
      // await saveTransaction(requestBody.context.transaction_id, userId);
      
      
      // Generate hash and authentication header
      const hashedBody = blake.blake2bHex(Buffer.from(JSON.stringify(requestBody)));
      const base64HashedBody = Buffer.from(hashedBody, 'hex').toString('base64');
      const { authHeader } = this.generateAuthHeader(base64HashedBody);

      // Save transaction details
      

      // Make API request
      const response = await axios.post(
        CONFIG.API_ENDPOINTS.SEARCH,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        }
      );

      return response.data;

    } catch (error) {
      console.error('Search request failed:', error);
      throw error;
    }
  }
}

module.exports = { searchRequest: SearchRequestHandler.searchRequest.bind(SearchRequestHandler) };