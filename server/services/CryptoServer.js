import crypto from 'node:crypto'

class CryptoServer {
    static generate_salt(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    static hashing_password(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    }

    static verify_password(password, salt, storedHash) {
        const inputHash = this.hashing_password(password, salt);

        return crypto.timingSafeEqual(
            Buffer.from(inputHash, 'hex'),
            Buffer.from(storedHash, 'hex')
        );
    }

    static generateJwtKeyPair() {
        return crypto.generateKeyPairSync('ec', {
            namedCurve: 'prime256v1',
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            },
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            }
        });
    }
}

export default CryptoServer;