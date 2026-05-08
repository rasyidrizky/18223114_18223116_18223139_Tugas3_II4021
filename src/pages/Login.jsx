import { useState } from 'react';
import authService from '../services/AuthService';
import CryptoClient from '../services/CryptoClient';

export default function Login({ onGoToRegister, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log("[DEBUG] Login start...");

        try {
            const result = await authService.login({ email, password });

            authService.setToken(result.token);

            const decryptedPrivateKey = await CryptoClient.decrypt_pk(
                result.user.encrypted_private_key,
                result.user.aes_iv,
                result.user.key_salt,
                password
            );

            sessionStorage.setItem('email', result.user.email);

            console.log("[DEBUG] Login result:", result);
            console.log("[DEBUG] Login finished");

            setStatus('success');
            setMessage('LOGIN SUCCESS: JWT SESSION GENERATED');

            // kirim data user + private key ke parent untuk navigasi ke Chat
            if (onLoginSuccess) {
                onLoginSuccess({
                    user: result.user,
                    privateKey: decryptedPrivateKey
                });
            }
        } catch (error) {
            console.log("[DEBUG] Login error:", error);
            console.log("[DEBUG] Backend response:", error.response?.data);

            setStatus('error');
            setMessage(error.response?.data?.error || 'LOGIN FAILED: INVALID CREDENTIAL OR KEY DATA');
        }
    };

    return (
        <section className="auth-page login-bg">
            <div className="top-brand">
                <span>STEI ITB CRYPTO</span>
                <span className="top-chip">LOGIN TERMINAL</span>
            </div>

            <div className="login-layout">
                <div className="login-info">
                    <div>
                        <div className="status-title">SECURE ACCESS</div>
                        <div className="node-text">NODE_ALPHA_01_CONNECTED</div>

                        <div className="feature-list">
                            <div>⬢ AES-256 SESSION ENCRYPTION</div>
                            <div>⬢ ECDSA P-256 SIGNING</div>
                            <div>⬢ JWT GENERATION ENABLED</div>
                        </div>
                    </div>

                    <div className="notice-box">
                        SYSTEM_NOTICE:<br />
                        This terminal session will generate a JSON Web Token via
                        ECDSA cryptographic curves.
                    </div>
                </div>

                <div className="auth-panel">
                    <div className="panel-title">LOGIN_TERMINAL</div>
                    <div className="panel-line"></div>

                    <form className="auth-form" onSubmit={handleLogin}>
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

                        <button className="auth-submit" type="submit">
                            EXECUTE_LOGIN.EXE
                        </button>
                    </form>

                    {message && (
                        <p className={status === 'success' ? 'status-success' : 'status-error'}>
                            {message}
                        </p>
                    )}

                    <div className="auth-extra">
                        <span>NEW_RECRUIT?</span>
                        <button className="text-button" type="button" onClick={onGoToRegister}>
                            CREATE_ACCOUNT
                        </button>
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