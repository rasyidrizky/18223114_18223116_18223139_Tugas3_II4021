import { useState } from 'react';
import CryptoClient from '../services/CryptoClient';
import authService from '../services/AuthService';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        console.log("[DEBUG] Register start...")
        try {
            const key_pair = await CryptoClient.generate_keypairECDH();
            const exportedPubKey = await window.crypto.subtle.exportKey("jwk", key_pair.publicKey);
            
            const { ciphertext, iv, key_salt } = await CryptoClient.encrypt_pk(key_pair.privateKey, password);

            const result = await authService.register({
                email: email, 
                password: password, 
                public_key: exportedPubKey, 
                encrypted_private_key: ciphertext, 
                aes_iv: iv,
                key_salt: key_salt
            });
            console.log("[DEBUG] Register finished");
        } catch (error) {
            console.log(error.toString());
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email"/>
                </div>
                <div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password"/>
                </div>
                <button type="submit">
                    Register
                </button>
            </form>
        </div>
    );
}