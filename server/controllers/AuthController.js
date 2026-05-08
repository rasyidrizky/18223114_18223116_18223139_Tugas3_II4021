import fs from 'node:fs';
import crypto from 'node:crypto';
import UserModel from '../models/UserModel.js';
import CryptoServer from '../services/CryptoServer.js';
import JwtLibrary from '../services/JwtLibrary.js';

const JWT_ALGS = new Set(['ES256', 'ES384', 'ES512']);

class AuthController {
    constructor() {
        this.userModel = new UserModel();
        this.jwtAlg = JWT_ALGS.has(process.env.JWT_ALG) ? process.env.JWT_ALG : 'ES256';
        this.keyPath = {
            private: this.jwtAlg === 'ES256'
                ? 'server/jwt_private.pem'
                : `server/jwt_${this.jwtAlg.toLowerCase()}_private.pem`,
            public: this.jwtAlg === 'ES256'
                ? 'server/jwt_public.pem'
                : `server/jwt_${this.jwtAlg.toLowerCase()}_public.pem`
        };

        if (!fs.existsSync(this.keyPath.private) || !fs.existsSync(this.keyPath.public)) {
            const { privateKey, publicKey } = CryptoServer.generateJwtKeyPair();
            fs.writeFileSync(this.keyPath.private, privateKey);
            fs.writeFileSync(this.keyPath.public, publicKey);
        }

        this.jwtPrivateKey = fs.readFileSync(this.keyPath.private, 'utf8');
    }

    register = async (req, res) => {
        try {
            const { email, password, public_key, encrypted_private_key, aes_iv, key_salt } = req.body;

            if (!email || !password || !public_key || !encrypted_private_key || !aes_iv || !key_salt) {
                return res.status(400).json({ error: "[DEBUG] Invalid register data" });
            }

            const existingUser = this.userModel.findByEmail(email);

            if (existingUser) {
                return res.status(409).json({ error: "[DEBUG] Email already registered" });
            }

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
            console.error(error);
            res.status(500).json({ error: "[DEBUG] Register failed" });
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "[DEBUG] Email and password are required" });
            }

            const user = this.userModel.findByEmail(email);

            if (!user) {
                return res.status(401).json({ error: "[DEBUG] Invalid email or password" });
            }

            const passwordValid = CryptoServer.verify_password(
                password,
                user.salt,
                user.hash_password
            );

            if (!passwordValid) {
                return res.status(401).json({ error: "[DEBUG] Invalid email or password" });
            }

            const now = Math.floor(Date.now() / 1000);

            const token = JwtLibrary.sign({
                header: {
                    alg: this.jwtAlg,
                    typ: 'JWT'
                },
                claims: {
                    iss: 'ii4021-chat-app',
                    sub: String(user.id),
                    aud: 'ii4021-chat-client',
                    iat: now,
                    nbf: now,
                    exp: now + 3600,
                    jti: crypto.randomUUID()
                },
                payload: {
                    email: user.email
                },
                privateKey: this.jwtPrivateKey
            });

            res.status(200).json({
                message: "[DEBUG] Login success",
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    public_key: JSON.parse(user.public_key),
                    encrypted_private_key: user.encrypted_private_key,
                    aes_iv: user.aes_iv,
                    key_salt: user.key_salt
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "[DEBUG] Login failed" });
        }
    }
}

export default AuthController;