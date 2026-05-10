import { useState } from 'react';
import authService from '../services/AuthService';
import CryptoClient from '../services/CryptoClient';
import mailIcon from '../assets/mail.png';
import passwordIcon from '../assets/password.png';
import pawIcon from '../assets/paw.png';
import floatingCat from '../assets/kucingngambang.png';
import '../styling/Login.css';

export default function Login({ onGoToRegister, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const result = await authService.login({ email, password });

            authService.setToken(result.token);

            const decryptedPrivateKey = await CryptoClient.decrypt_pk(
                result.user.encrypted_private_key,
                result.user.aes_iv,
                result.user.key_salt,
                password
            );

            const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', decryptedPrivateKey);
            authService.setSession({
                user: result.user,
                privateKey: privateKeyJwk
            });

            sessionStorage.setItem('email', result.user.email);

            setStatus('success');
            setMessage('Login berhasil');

            if (onLoginSuccess) {
                onLoginSuccess({
                    user: result.user,
                    privateKey: decryptedPrivateKey
                });
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Login gagal');
        }
    };

    return (
        <section className="login-page">
            <div className="login-box">
                <img className="login-cat" src={floatingCat} alt="Kucing ngambang" />

                <div className="login-card">
                    <div className="login-title-row">
                        <h1>meowchat</h1>
                        <span className="login-title-paw" aria-hidden="true">🐾</span>
                    </div>
                    <p>Selamat datang kembali!</p>

                    <form onSubmit={handleLogin}>
                        <label className="input-wrap">
                            <img src={mailIcon} alt="" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email"
                            />
                        </label>

                        <label className="input-wrap">
                            <img src={passwordIcon} alt="" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                            />
                        </label>

                        <button className="login-btn" type="submit">
                            <img className="login-btn-paw" src={pawIcon} alt="" />
                            <span>LOGIN</span>
                        </button>
                    </form>

                    {message && (
                        <p className={status === 'success' ? 'status-success' : 'status-error'}>
                            {message}
                        </p>
                    )}

                    <div className="register-text">
                        <span>Belum punya akun?</span>{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onGoToRegister();
                            }}
                        >
                            Daftar di sini
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}