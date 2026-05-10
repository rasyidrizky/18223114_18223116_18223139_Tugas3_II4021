import { useState } from 'react';
import CryptoClient from '../services/CryptoClient';
import authService from '../services/AuthService';
import '../styling/Register.css';
import sleepingCat from '../assets/kucingtidur.png';
import mail from '../assets/mail.png';
import passwordIcon from '../assets/password.png';
import paw from '../assets/paw.png';

export default function Register({ onGoToLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirmPassword) {
            setLoading(false);
            setStatus('error');
            setMessage('Registrasi gagal');
            return;
        }

        try {
            const keyPair = await CryptoClient.generate_keypairECDH();
            const exportedPubKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
            const { ciphertext, iv, key_salt } = await CryptoClient.encrypt_pk(keyPair.privateKey, password);

            await authService.register({
                email,
                password,
                public_key: exportedPubKey,
                encrypted_private_key: ciphertext,
                aes_iv: iv,
                key_salt
            });

            setStatus('success');
            setMessage('Registrasi berhasil');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Registrasi gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="register-page">
            <div className="register-box">
                <img className="register-cat" src={sleepingCat} alt="Kucing tidur" />

                <div className="register-card">
                    <h1>Buat Akun</h1>
                    <p>Bergabunglah dengan MeowChat!</p>

                    <form onSubmit={handleRegister}>
                        <label className="register-input-wrap">
                            <img src={mail} alt="" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email"
                            />
                        </label>

                        <label className="register-input-wrap">
                            <img src={passwordIcon} alt="" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                            />
                        </label>

                        <label className="register-input-wrap">
                            <img src={passwordIcon} alt="" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Konfirmasi Password"
                            />
                        </label>

                        <button className="register-btn" type="submit" disabled={loading}>
                            <img className="register-btn-paw" src={paw} alt="" />
                            <span>{loading ? 'Sedang memproses...' : 'Daftar'}</span>
                        </button>
                    </form>

                    {message && (
                        <p className={status === 'success' ? 'register-status-success' : 'register-status-error'}>
                            {message}
                        </p>
                    )}

                    <div className="register-link-text">
                        <span>Sudah punya akun?</span>{' '}
                        <button
                            type="button"
                            className="register-link-button"
                            onClick={onGoToLogin}
                        >
                            Login di sini
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}