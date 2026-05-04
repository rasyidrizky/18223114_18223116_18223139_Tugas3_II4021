import fs from 'node:fs';
import JwtLibrary from './JwtLibrary.js';

const jwtPublicKey = fs.readFileSync('server/jwt_public.pem', 'utf8');

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '[DEBUG] Missing token' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = JwtLibrary.verify({
            jwt: token,
            publicKey: jwtPublicKey,
            options: {
                algs: ['ES256'],
                iss: 'ii4021-chat-app',
                aud: 'ii4021-chat-client'
            }
        });

        req.user = decoded.payload;
        next();
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export default authMiddleware;