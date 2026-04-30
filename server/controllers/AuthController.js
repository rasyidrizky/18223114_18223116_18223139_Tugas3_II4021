import UserModel from '../models/UserModel.js';
import CryptoServer from '../services/CryptoServer.js';

class AuthController {
    constructor() {
        this.userModel = new UserModel();
    }

    register = async (req, res) => {
        try {
            const { email, password, public_key, encrypted_private_key, aes_iv, key_salt } = req.body;

            // generate salt + hash password
            const salt = CryptoServer.generate_salt();
            const hashed_password = CryptoServer.hashing_password(password, salt);

            const userData = {
                email: email,
                password_hash: hashed_password,
                salt: salt,
                key_salt: key_salt,
                public_key: public_key,
                encrypted_private_key: encrypted_private_key,
                aes_iv: aes_iv,
            };

            this.userModel.createUser(userData);
            res.status(201).json({ message: "[DEBUG] Created user" });
        } catch (error) {
            console.error(err);
            res.status(500).json({ error: "[DEBUG] Register failed" });
        }
    }
}

export default AuthController;