import { useState, useEffect, useRef } from 'react';
import chatService from '../services/ChatService';
import CryptoClient from '../services/CryptoClient';
import authService from '../services/AuthService';

export default function Chat({ currentUser, privateKey, onLogout }) {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [cryptoStatus, setCryptoStatus] = useState('');
    const messagesEndRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // load contacts saat mount
    useEffect(() => {
        loadContacts();
    }, []);

    // auto-scroll ke pesan terbaru
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // polling pesan setiap 3 detik saat ada kontak terpilih
    useEffect(() => {
        if (selectedContact) {
            loadMessages(selectedContact);
            pollIntervalRef.current = setInterval(() => {
                loadMessages(selectedContact);
            }, 3000);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [selectedContact?.id]);

    const loadContacts = async () => {
        try {
            const data = await chatService.getContacts();
            setContacts(data.contacts || []);
        } catch (err) {
            console.error('[DEBUG] Failed to load contacts:', err);
            setError('Failed to load contacts');
        }
    };

    const loadMessages = async (contact) => {
        try {
            const data = await chatService.getMessages(contact.id);
            const rawMessages = data.messages || [];

            // decrypt semua pesan
            const decryptedMessages = [];

            for (const msg of rawMessages) {
                try {
                    // tentukan public key lawan bicara
                    const partnerPubKey = contact.public_key;

                    // ECDH → shared secret
                    const sharedSecret = await CryptoClient.deriveSharedSecret(
                        privateKey,
                        partnerPubKey
                    );

                    // HKDF → AES key + HMAC key
                    const { aesKey, hmacKey } = await CryptoClient.deriveAESKeyFromSecret(sharedSecret);

                    // verify HMAC → AES-GCM Decrypt
                    const plaintext = await CryptoClient.decryptMessage(
                        aesKey,
                        hmacKey,
                        msg.ciphertext,
                        msg.iv,
                        msg.mac
                    );

                    decryptedMessages.push({
                        ...msg,
                        plaintext,
                        decryptError: false
                    });
                } catch (decryptErr) {
                    console.error('[DEBUG] Decrypt error for msg', msg.id, ':', decryptErr);
                    decryptedMessages.push({
                        ...msg,
                        plaintext: '⚠ DECRYPTION FAILED: ' + decryptErr.message,
                        decryptError: true
                    });
                }
            }

            setMessages(decryptedMessages);
        } catch (err) {
            console.error('[DEBUG] Failed to load messages:', err);
        }
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setMessages([]);
        setError('');
        setCryptoStatus('');
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedContact || sending) return;

        setSending(true);
        setError('');
        setCryptoStatus('ECDH KEY EXCHANGE...');

        try {
            // 1. ECDH → derive shared secret
            const sharedSecret = await CryptoClient.deriveSharedSecret(
                privateKey,
                selectedContact.public_key
            );
            setCryptoStatus('HKDF KEY DERIVATION...');

            // 2. HKDF → derive AES key + HMAC key
            const { aesKey, hmacKey } = await CryptoClient.deriveAESKeyFromSecret(sharedSecret);
            setCryptoStatus('AES-256-GCM ENCRYPTING...');

            // 3. AES-GCM Encrypt + HMAC
            const { ciphertext, iv, mac } = await CryptoClient.encryptMessage(
                aesKey,
                hmacKey,
                messageInput.trim()
            );
            setCryptoStatus('HMAC SIGNING & TRANSMITTING...');

            // 4. kirim ke API
            await chatService.sendMessage({
                receiver_id: selectedContact.id,
                ciphertext,
                iv,
                mac
            });

            setCryptoStatus('MESSAGE SENT SECURELY ✓');
            setMessageInput('');

            // reload pesan
            await loadMessages(selectedContact);

            setTimeout(() => setCryptoStatus(''), 2000);
        } catch (err) {
            console.error('[DEBUG] Send error:', err);
            setError('Failed to send message: ' + (err.response?.data?.error || err.message));
            setCryptoStatus('');
        } finally {
            setSending(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        onLogout();
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return timestamp;
        }
    };

    return (
        <section className="chat-page">
            {/* Top Bar */}
            <div className="chat-topbar">
                <span className="chat-brand">STEI ITB CRYPTO</span>
                <span className="chat-user-info">
                    <span className="chat-user-dot"></span>
                    {currentUser.email}
                </span>
                <button className="chat-logout-btn" onClick={handleLogout}>
                    DISCONNECT
                </button>
            </div>

            <div className="chat-container">
                {/* Sidebar Kontak */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-title">CONTACTS</div>
                        <div className="sidebar-subtitle">
                            {contacts.length} REGISTERED NODE{contacts.length !== 1 ? 'S' : ''}
                        </div>
                    </div>

                    <div className="contact-list">
                        {contacts.length === 0 && (
                            <div className="no-contacts">NO OTHER NODES DETECTED</div>
                        )}
                        {contacts.map(contact => (
                            <div
                                key={contact.id}
                                className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                onClick={() => handleSelectContact(contact)}
                            >
                                <div className="contact-avatar">
                                    {contact.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="contact-info">
                                    <div className="contact-name">{contact.email}</div>
                                    <div className="contact-key">
                                        ECDH P-256 • {contact.public_key?.x?.substring(0, 8)}...
                                    </div>
                                </div>
                                <div className={`contact-status-dot ${selectedContact?.id === contact.id ? 'active' : ''}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Area Chat */}
                <div className="chat-main">
                    {!selectedContact ? (
                        <div className="chat-empty">
                            <div className="chat-empty-icon">⬢</div>
                            <div className="chat-empty-title">SELECT A NODE</div>
                            <div className="chat-empty-text">
                                Choose a contact to establish an end-to-end encrypted channel.
                            </div>
                            <div className="chat-empty-specs">
                                <div>⬢ ECDH P-256 Key Exchange</div>
                                <div>⬢ HKDF-SHA256 Key Derivation</div>
                                <div>⬢ AES-256-GCM Encryption</div>
                                <div>⬢ HMAC-SHA256 Authentication</div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <div className="chat-header-name">{selectedContact.email}</div>
                                    <div className="chat-header-meta">
                                        E2E ENCRYPTED • AES-256-GCM • HMAC-SHA256
                                    </div>
                                </div>
                                <div className="chat-header-lock">🔒</div>
                            </div>

                            {/* Messages Area */}
                            <div className="chat-messages" id="chat-messages-area">
                                {messages.length === 0 && (
                                    <div className="chat-no-messages">
                                        <div>— ENCRYPTED CHANNEL ESTABLISHED —</div>
                                        <div className="chat-no-messages-sub">
                                            Messages are end-to-end encrypted. No one outside this chat can read them.
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message-row ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                                    >
                                        <div className={`message-bubble ${msg.decryptError ? 'error' : ''}`}>
                                            <div className="message-text">{msg.plaintext}</div>
                                            <div className="message-meta">
                                                <span className="message-time">{formatTime(msg.timestamp)}</span>
                                                {!msg.decryptError && (
                                                    <span className="message-lock">🔒</span>
                                                )}
                                                {msg.decryptError && (
                                                    <span className="message-warn">⚠</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Crypto Status */}
                            {cryptoStatus && (
                                <div className="crypto-status-bar">
                                    <span className="crypto-status-dot"></span>
                                    {cryptoStatus}
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="chat-error-bar">{error}</div>
                            )}

                            {/* Input Area */}
                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <input
                                    className="chat-text-input"
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type an encrypted message..."
                                    disabled={sending}
                                    id="chat-message-input"
                                />
                                <button
                                    className="chat-send-btn"
                                    type="submit"
                                    disabled={sending || !messageInput.trim()}
                                    id="chat-send-button"
                                >
                                    {sending ? 'ENCRYPTING...' : 'SEND'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
