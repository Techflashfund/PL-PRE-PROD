const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const nacl = require('tweetnacl');
const blake = require('blakejs');
const CONFIG = require('../config/search.config');

class SelectRequestHandler {
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

    static async createSelectonePayload(ondcResponse, formSubmissionId) {
        const selectPayload = {
            context: {
                ...ondcResponse.context,
                action: "select",
                message_id: uuidv4(),
                timestamp: new Date().toISOString()
            },
            message: {
                order: {
                    provider: {
                        id: ondcResponse.message.catalog.providers[0].id
                    },
                    items: [
                        {
                            id: ondcResponse.message.catalog.providers[0].items[0].id,
                            xinput: {
                                form: {
                                    id: ondcResponse.message.catalog.providers[0].items[0].xinput.form.id
                                },
                                form_response: {
                                    status: "SUCCESS",
                                    submission_id: formSubmissionId
                                }
                            }
                        }
                    ]
                }
            }
        };
        console.log('Select Payload Created:', JSON.stringify(selectPayload, null, 2));
        return selectPayload;
    }

    static async makeSelectRequest(selectPayload) {
        try {
           
            const hashedBody = blake.blake2bHex(Buffer.from(JSON.stringify(selectPayload)));
            const base64HashedBody = Buffer.from(hashedBody, 'hex').toString('base64');
            const { authHeader } = this.generateAuthHeader(base64HashedBody);

            const response = await axios.post(
                `${selectPayload.context.bpp_uri}/select`,
                selectPayload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Select request failed:', error);
            throw error;
        }
    }
}

module.exports = SelectRequestHandler;