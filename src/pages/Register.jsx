import { useState } from 'react';
import CryptoClient from '../services/CryptoClient';
import authService from '../services/AuthService';

export default function Register({ onGoToLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultDetail, setResultDetail] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResultDetail(null);

        if (password !== confirmPassword) {
            setLoading(false);
            setStatus('error');
            setMessage('Registrasi gagal');

            setResultDetail({
                error: 'Password confirmation does not match',
                statusCode: 'Client validation',
                email: email
            });

            return;
        }

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

            setStatus('success');
            setMessage('Registrasi berhasil');

            setResultDetail({
                email: email,
                serverMessage: result.message,
                keyPair: 'ECDH P-256 generated',
                privateKey: 'Encrypted with AES-256-GCM',
                publicKey: exportedPubKey.kty + ' / ' + exportedPubKey.crv,
                ciphertextLength: ciphertext.length,
                ivLength: iv.length,
                keySaltLength: key_salt.length
            });
        } catch (error) {
            setStatus('error');
            setMessage('Registrasi gagal');

            setResultDetail({
                error: error.response?.data?.error || error.message || 'Unknown error',
                statusCode: error.response?.status || 'No response',
                email: email
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page register-bg">
            <div className="top-brand">
                <span>STEI ITB CRYPTO</span>
                <span className="top-chip">REGISTRATION TERMINAL</span>
            </div>

            <div className="register-layout">
                <div className="register-panel">
                    <div className="panel-title">SYSTEM ACCESS</div>
                    <div className="panel-line"></div>

                    <p className="register-subtitle">
                        Initialize new cryptographic identity on the network.
                    </p>

                    <form className="auth-form" onSubmit={handleRegister}>
                        <div>
                            <div className="form-label">INSTITUTIONAL EMAIL</div>
                            <input
                                className="auth-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="user@itb.ac.id"
                            />
                        </div>

                        <div>
                            <div className="form-label">MASTER PASSWORD</div>
                            <input
                                className="auth-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="********"
                            />
                        </div>

                        <div>
                            <div className="form-label">CONFIRM MASTER PASSWORD</div>
                            <input
                                className="auth-input"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="********"
                            />
                        </div>

                        <div className="security-box">
                            SECURITY PROTOCOL: Your private key will be locally encrypted
                            with AES-256-GCM using your master password before being stored.
                        </div>

                        <button className="auth-submit" type="submit" disabled={loading}>
                            {loading ? 'Sedang memproses...' : 'Daftar'}
                        </button>
                    </form>

                    {message && (
                        <p className={status === 'success' ? 'status-success' : 'status-error'}>
                            {message}
                        </p>
                    )}

                    {resultDetail && status === 'success' && (
                        <div className="result-box success-box">
                            <div>STATUS: SUCCESS</div>
                            <div>EMAIL: {resultDetail.email}</div>
                            <div>SERVER: {resultDetail.serverMessage}</div>
                            <div>KEY PAIR: {resultDetail.keyPair}</div>
                            <div>PUBLIC KEY: {resultDetail.publicKey}</div>
                            <div>PRIVATE KEY: {resultDetail.privateKey}</div>
                            <div>CIPHERTEXT LENGTH: {resultDetail.ciphertextLength}</div>
                            <div>IV LENGTH: {resultDetail.ivLength}</div>
                            <div>SALT LENGTH: {resultDetail.keySaltLength}</div>
                        </div>
                    )}

                    {resultDetail && status === 'error' && (
                        <div className="result-box error-box">
                            <div>STATUS: FAILED</div>
                            <div>EMAIL: {resultDetail.email}</div>
                            <div>HTTP STATUS: {resultDetail.statusCode}</div>
                            <div>ERROR: {resultDetail.error}</div>
                        </div>
                    )}

                    <div className="auth-extra">
                        <span>ALREADY_REGISTERED?</span>
                        <button className="text-button" type="button" onClick={onGoToLogin}>
                            BACK_TO_LOGIN
                        </button>
                    </div>
                </div>

                <div className="crypto-panel">
                    <div className="panel-title">CRYPTOGRAPHIC ENGINE</div>
                    <div className="panel-line"></div>

                    <div className="progress-box">
                        <div className="progress-title">
                            {loading ? 'Generating ECDH Key Pair (P-256)' : 'ECDH Engine Ready'}
                        </div>

                        <div className="progress-bar">
                            <span className="active"></span>
                            <span className="active"></span>
                            <span className="active"></span>
                            <span className={loading ? 'active' : ''}></span>
                            <span className={loading ? 'active' : ''}></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>

                    <div className="terminal-log">
                        <div>&gt; Initializing entropy source...</div>
                        <div>&gt; Gathering environmental noise...</div>
                        <div>&gt; Performing Curve P-256 scalar multiplication...</div>
                        <div className="warning">&gt; Waiting for secure registration...</div>
                    </div>

                    <div className="mini-grid">
                        <div className="mini-card">
                            NODE STATUS
                            <strong>ACTIVE</strong>
                        </div>

                        <div className="mini-card">
                            AUTH METHOD
                            <strong>ECDH-P256</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-footer">
                <span>STEI ITB CRYPTO</span>
                <span>SYSTEM STATUS: ACTIVE</span>
            </div>
        </section>
    );
}