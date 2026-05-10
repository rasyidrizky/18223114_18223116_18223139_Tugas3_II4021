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

export default function Chat({ currentUser, privateKey, initialContactId, onGoToDashboard, onGoToContacts, onGoToProfile, onLogout }) {
    const [contacts, setContacts] = useState([]);
    const [contactAvatars, setContactAvatars] = useState({});
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [cryptoStatus, setCryptoStatus] = useState('');
    const [showMenu, setShowMenu] = useState(false);
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
            <div className="chat-app-window">
                <aside className="chat-sidebar">
                    <div className="chat-sidebar-top" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                        <div className="chat-sidebar-search-row">
                            <div className="chat-search">
                                <img src={searchIcon} alt="" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari chat..."
                                />
                            </div>
                            <button className="chat-add-btn" type="button" onClick={onGoToDashboard} title="Kembali ke Dashboard">
                                +
                            </button>
                        </div>
                    </div>

                    <div className="contact-list">
                        {filteredContacts.length === 0 && (
                            <div className="chat-empty-state">
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
                                    <div className="contact-preview">
                                        {contact.public_key?.x?.substring(0, 16)}...
                                    </div>
                                </div>
                                <div className="contact-time-badge">
                                    <span className="time">Kemarin</span>
                                    <div className={`contact-dot ${contact.id % 2 === 0 ? 'online' : ''}`}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="chat-main-window">
                    <header className="chat-main-header">
                        <div className="chat-header-profile">
                            {selectedContact ? (
                                <>
                                    <img src={avatarForContact(selectedContact.id)} alt={selectedContact.email} className="chat-header-avatar" />
                                    <div className="chat-header-info">
                                        <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{selectedContact.email}</h2>
                                    </div>
                                </>
                            ) : (
                                <div className="chat-header-info">
                                    <h2 style={{ color: '#8a7767' }}>MeowChat</h2>
                                </div>
                            )}
                        </div>
                        <div className="chat-header-actions" style={{ position: 'relative' }}>
                            {selectedContact && (
                                <button className="icon-btn" type="button">
                                    <img src={searchIcon} alt="Search" />
                                </button>
                            )}
                            <button className="icon-btn" type="button" onClick={() => setShowMenu(!showMenu)} title="Menu">
                                ⋮
                            </button>

                            {showMenu && (
                                <div className="chat-dropdown-menu">
                                    {onGoToDashboard && (
                                        <button type="button" onClick={onGoToDashboard}>
                                            Dashboard
                                        </button>
                                    )}
                                    {onGoToContacts && (
                                        <button type="button" onClick={onGoToContacts}>
                                            Daftar Kontak
                                        </button>
                                    )}
                                    {onGoToProfile && (
                                        <button type="button" onClick={onGoToProfile}>
                                            Profile
                                        </button>
                                    )}
                                    <button type="button" onClick={handleLogout} className="danger">
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    {selectedContact ? (
                        <>
                            <div className="chat-messages paw-bg" id="chat-messages-area">
                                {messages.length === 0 && (
                                    <div className="chat-empty-chat">
                                        <div className="chat-empty-note">
                                            <strong>— ENCRYPTED CHANNEL ESTABLISHED —</strong>
                                            <span>Pesan dienkripsi end-to-end.</span>
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
                                                {!msg.decryptError && <span>✓✓</span>}
                                                {msg.decryptError && <span className="warn">⚠</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {cryptoStatus && <div className="crypto-status">{cryptoStatus}</div>}
                            {error && <div className="chat-error">{error}</div>}

                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Ketik pesan..."
                                    disabled={sending}
                                    id="chat-message-input"
                                    autoComplete="off"
                                />
                                <button
                                    className="chat-send-plane"
                                    type="submit"
                                    disabled={sending || !messageInput.trim()}
                                    id="chat-send-button"
                                    title="Kirim Pesan"
                                >
                                    ➤
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-empty-chat">
                            <div className="chat-empty-note">
                                <strong>Pilih kontak untuk mulai chat</strong>
                                <span>Semua pesan akan dienkripsi otomatis.</span>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </section>
    );
}
