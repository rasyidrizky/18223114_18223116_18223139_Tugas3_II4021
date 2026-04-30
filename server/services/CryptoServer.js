import crypto from 'node:crypto'

class CryptoServer {
    static generate_salt(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    static hashing_password(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    }
}

export default CryptoServer;