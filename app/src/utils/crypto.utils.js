const nacl = require('tweetnacl');
const blake = require('blakejs');
const CONFIG = require('../config/search.config');

class CryptoUtils {
    static signMessage(message) {
        if (!message) throw new Error('Message to sign cannot be empty');
        
        const privateKey = Buffer.from(CONFIG.PRIVATE_KEY, 'base64');
        if (privateKey.length !== 64) throw new Error('Invalid private key length');

        const messageUint8Array = new TextEncoder().encode(message);
        const signature = nacl.sign.detached(messageUint8Array, privateKey);
        return Buffer.from(signature).toString('base64');
    }

    static generateAuthHeader(hashedBody) {
        if (!hashedBody) throw new Error('Hashed body cannot be empty');

        const created = Math.floor(Date.now() / 1000) - 10000;
        const expires = Math.floor((Date.now() + CONFIG.SIGNATURE_VALIDITY) / 1000);
        
        const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${hashedBody}`;
        const signature = this.signMessage(signingString);

        return {
            authHeader: `Signature keyId="${CONFIG.KEY_ID}",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`,
            created,
            expires
        };
    }
}

module.exports = CryptoUtils;