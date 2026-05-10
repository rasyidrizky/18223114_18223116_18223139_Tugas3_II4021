import { useState, useEffect, useRef } from 'react';
import chatService from '../services/ChatService';
import CryptoClient from '../services/CryptoClient';
import authService from '../services/AuthService';
import '../styling/Chat.css';
import friendIcon from '../assets/friend.png';
import chatIcon from '../assets/chat.png';
import profileIcon from '../assets/profileicon.png';
import searchIcon from '../assets/search.png';
import avatar1 from '../assets/profile1.jpg';
import avatar2 from '../assets/profile2.jpg';
import avatar3 from '../assets/profile3.jpg';
import avatar4 from '../assets/profile4.jpg';
import avatar5 from '../assets/profile5.jpg';

const AVATAR_POOL = [avatar1, avatar2, avatar3, avatar4, avatar5];

export default function Chat({ currentUser, privateKey, initialContactId, onGoToDashboard, onLogout }) {
    const [contacts, setContacts] = useState([]);
    const [contactAvatars, setContactAvatars] = useState({});
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [cryptoStatus, setCryptoStatus] = useState('');
    const messagesEndRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const filteredContacts = contacts.filter((contact) =>
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const avatarForContact = (contactId) => contactAvatars[contactId] || AVATAR_POOL[0];

    useEffect(() => {
        if (!contacts.length) {
            setContactAvatars({});
            return;
        }

        const nextAvatars = {};

        for (const contact of contacts) {
            const randomIndex = Math.floor(Math.random() * AVATAR_POOL.length);
            nextAvatars[contact.id] = AVATAR_POOL[randomIndex];
        }

        setContactAvatars(nextAvatars);
    }, [contacts]);

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

    useEffect(() => {
        if (!initialContactId || !contacts.length) {
            return;
        }

        const initialContact = contacts.find((contact) => contact.id === Number(initialContactId));

        if (initialContact && selectedContact?.id !== initialContact.id) {
            handleSelectContact(initialContact);
        }
    }, [initialContactId, contacts]);

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
            <div className="chat-shell">
                <header className="chat-topbar">
                    <div className="chat-brand">
                        <img src={profileIcon} alt="meowchat" />
                        <div className="chat-brand-copy">
                            <span>meowchat</span>
                            <strong>Encrypted Chat Room</strong>
                        </div>
                    </div>

                    <div className="chat-topbar-copy">
                        <span>{currentUser?.email}</span>
                        <strong>Pilih kontak lalu mulai percakapan terenkripsi.</strong>
                    </div>

                    <div className="chat-topbar-actions">
                        {onGoToDashboard && (
                            <button className="chat-topbar-button secondary" type="button" onClick={onGoToDashboard}>
                                Dashboard
                            </button>
                        )}

                        <button className="chat-topbar-button" type="button" onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>
                </header>

                <div className="chat-workspace">
                    <section className="chat-panel">
                        <div className="panel-header">
                            <div className="panel-title">
                                <h2>Daftar Kontak</h2>
                                <p>{filteredContacts.length} kontak ditemukan</p>
                            </div>

                            <div className="chat-search">
                                <img src={searchIcon} alt="" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari kontak..."
                                />
                            </div>
                        </div>

                        <div className="contact-list">
                            {filteredContacts.length === 0 && (
                                <div className="chat-empty-state">
                                    <img src={friendIcon} alt="" />
                                    <div className="chat-empty-note">
                                        <strong>Tidak ada kontak</strong>
                                        <span>Coba kata kunci lain.</span>
                                    </div>
                                </div>
                            )}

                            {filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    type="button"
                                    className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                    onClick={() => handleSelectContact(contact)}
                                >
                                    <div className="contact-avatar">
                                        <img src={avatarForContact(contact.id)} alt={contact.email} />
                                    </div>
                                    <div className="contact-meta">
                                        <div className="contact-name">{contact.email}</div>
                                        <div className="contact-status">
                                            ECDH P-256 • {contact.public_key?.x?.substring(0, 8)}...
                                        </div>
                                    </div>
                                    <div className={`contact-dot ${contact.id % 2 === 0 ? 'online' : ''}`}></div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="chat-panel chat-window">
                        {selectedContact ? (
                            <>
                                <div className="chat-header">
                                    <div className="chat-header-info">
                                        <h2>{selectedContact.email}</h2>
                                        <p>E2E ENCRYPTED • AES-256-GCM • HMAC-SHA256</p>
                                    </div>
                                    <div className="chat-header-lock">🔒</div>
                                </div>

                                <div className="chat-messages" id="chat-messages-area">
                                    {messages.length === 0 && (
                                        <div className="chat-empty-chat">
                                            <div className="chat-empty-note">
                                                <img src={chatIcon} alt="" />
                                                <strong>— ENCRYPTED CHANNEL ESTABLISHED —</strong>
                                                <span>Messages are end-to-end encrypted.</span>
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`chat-message-row ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                                        >
                                            <div className={`chat-bubble ${msg.decryptError ? 'error' : ''}`}>
                                                <div className="chat-message-text">{msg.plaintext}</div>
                                                <div className="chat-message-meta">
                                                    <span>{formatTime(msg.timestamp)}</span>
                                                    {!msg.decryptError && <span>🔒</span>}
                                                    {msg.decryptError && <span className="warn">⚠</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {cryptoStatus && <div className="crypto-status">{cryptoStatus}</div>}

                                {error && <div className="chat-error">{error}</div>}

                                <form className="chat-input" onSubmit={handleSendMessage}>
                                    <label className="chat-compose">
                                        <img src={chatIcon} alt="" />
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder="Ketik pesan..."
                                            disabled={sending}
                                            id="chat-message-input"
                                        />
                                    </label>

                                    <button
                                        className="chat-send"
                                        type="submit"
                                        disabled={sending || !messageInput.trim()}
                                        id="chat-send-button"
                                    >
                                        {sending ? 'ENCRYPTING...' : 'Kirim'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="chat-empty-chat">
                                <div className="chat-empty-note">
                                    <img src={friendIcon} alt="" />
                                    <strong>Pilih kontak untuk mulai chat</strong>
                                    <span>Semua pesan akan dienkripsi otomatis.</span>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </section>
    );
}
