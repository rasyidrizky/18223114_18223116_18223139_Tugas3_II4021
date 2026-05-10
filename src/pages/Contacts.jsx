import { useEffect, useMemo, useState } from 'react';
import chatService from '../services/ChatService';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import '../styling/Contacts.css';
import homeIcon from '../assets/home.png';
import friendIcon from '../assets/friend.png';
import chatIcon from '../assets/chat.png';
import profileIcon from '../assets/profileicon.png';
import logoutIcon from '../assets/iconlogout.png';
import searchIcon from '../assets/search.png';
import avatar1 from '../assets/profile1.jpg';
import avatar2 from '../assets/profile2.jpg';
import avatar3 from '../assets/profile3.jpg';
import avatar4 from '../assets/profile4.jpg';
import avatar5 from '../assets/profile5.jpg';

const AVATAR_POOL = [avatar1, avatar2, avatar3, avatar4, avatar5];

export default function Contacts({ currentUser, onGoToDashboard, onGoToChat, onGoToProfile, onLogout }) {
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContactEmail, setNewContactEmail] = useState('');
    const [modalError, setModalError] = useState('');
    const [savingContact, setSavingContact] = useState(false);

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const data = await chatService.getContacts();
                setContacts(data.contacts || []);
            } catch (err) {
                console.error('[DEBUG] Failed to load contacts page contacts:', err);
                setError('Gagal memuat daftar kontak.');
            }
        };

        loadContacts();
    }, []);

    const contactAvatars = useMemo(() => {
        const result = {};

        for (const contact of contacts) {
            result[contact.id] = AVATAR_POOL[contact.id % AVATAR_POOL.length];
        }

        return result;
    }, [contacts]);

    const filteredContacts = contacts.filter((contact) =>
        contact.is_added && contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addContactPreview = useMemo(() => {
        const normalizedEmail = newContactEmail.trim().toLowerCase();

        if (!normalizedEmail) {
            return null;
        }

        return contacts.find((contact) => contact.email.toLowerCase() === normalizedEmail) || null;
    }, [contacts, newContactEmail]);

    const updateContactInList = (updatedContact) => {
        setContacts((currentContacts) => {
            const exists = currentContacts.some((contact) => contact.id === updatedContact.id);

            if (!exists) {
                return [updatedContact, ...currentContacts];
            }

            return currentContacts.map((contact) =>
                contact.id === updatedContact.id ? { ...contact, ...updatedContact } : contact
            );
        });
    };

    const openContactPopup = (contact) => {
        setSelectedContact(contact);
        setModalError('');
        setShowAddModal(false);
    };

    const closePopup = () => {
        setSelectedContact(null);
        setShowAddModal(false);
        setModalError('');
    };

    const handleGoToSelectedChat = () => {
        if (!selectedContact) {
            return;
        }

        onGoToChat(selectedContact.id);
    };

    const handleAddSelectedContact = async () => {
        if (!selectedContact || selectedContact.is_added) {
            return;
        }

        setSavingContact(true);
        setModalError('');

        try {
            const data = await chatService.addContact({ contact_id: selectedContact.id });
            updateContactInList(data.contact);
            setSelectedContact((current) => (current ? { ...current, is_added: true } : current));
        } catch (err) {
            console.error('[DEBUG] Failed to add selected contact:', err);
            setModalError(err.response?.data?.error || 'Gagal menambahkan kontak.');
        } finally {
            setSavingContact(false);
        }
    };

    const openAddContactModal = () => {
        setShowAddModal(true);
        setSelectedContact(null);
        setModalError('');
        setNewContactEmail('');
    };

    const handleAddContactSubmit = async (e) => {
        e.preventDefault();

        if (!newContactEmail.trim()) {
            setModalError('Email kontak tidak boleh kosong.');
            return;
        }

        if (!addContactPreview) {
            setModalError('Profil tidak ditemukan.');
            return;
        }

        if (addContactPreview.is_added) {
            setModalError('Kontak sudah ada di daftar.');
            return;
        }

        setSavingContact(true);
        setModalError('');

        try {
            const data = await chatService.addContact({ contact_id: addContactPreview.id });
            updateContactInList(data.contact);
            setSelectedContact(data.contact);
            setShowAddModal(false);
            setNewContactEmail('');
        } catch (err) {
            console.error('[DEBUG] Failed to add contact by email:', err);
            setModalError(err.response?.data?.error || 'Gagal menambahkan kontak.');
        } finally {
            setSavingContact(false);
        }
    };

    const sidebarItems = [
        { label: 'Dashboard', icon: homeIcon, action: onGoToDashboard },
        { label: 'Daftar Kontak', icon: friendIcon, active: true },
        { label: 'Chat', icon: chatIcon, action: onGoToChat },
        { label: 'Profile', icon: profileIcon, action: onGoToProfile },
        { label: 'Log Out', icon: logoutIcon, iconClass: 'dashboard-icon-logout', action: onLogout }
    ];

    return (
        <section className="contacts-page">
            <div className="contacts-shell">
                <DashboardSidebar items={sidebarItems} catVariant="kucing" currentUser={currentUser} />

                <main className="contacts-main">
                    <section className="contacts-panel">
                        <div className="contacts-header">
                            <div className="contacts-title">
                                <h1>Daftar Kontak</h1>
                                <p>{currentUser?.email || 'MeowChat'} • {filteredContacts.length} kontak ditemukan</p>
                            </div>

                            <button className="contacts-add-button" type="button" onClick={openAddContactModal}>
                                <span>+</span>
                                Tambah
                            </button>
                        </div>

                        <label className="contacts-search">
                            <img src={searchIcon} alt="" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari kontak..."
                            />
                        </label>

                        {error && <div className="contacts-error">{error}</div>}

                        <div className="contacts-list">
                            {filteredContacts.length === 0 && !error && (
                                <div className="contacts-empty">
                                    <strong>Tidak ada kontak</strong>
                                    <span>Coba kata kunci lain.</span>
                                </div>
                            )}

                            {filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    type="button"
                                    className="contacts-card contacts-card-button"
                                    onClick={() => openContactPopup(contact)}
                                >
                                    <div className="contacts-card-avatar">
                                        <img src={contactAvatars[contact.id]} alt={contact.email} />
                                    </div>

                                    <div className="contacts-card-copy">
                                        <strong>{contact.email}</strong>
                                        <span>ECDH P-256 • {contact.public_key?.x?.substring(0, 8)}...</span>
                                    </div>

                                    <div className={`contacts-card-status ${contact.id % 2 === 0 ? 'online' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </section>
                </main>
            </div>

            {selectedContact && (
                <div className="contacts-modal-backdrop" onClick={closePopup}>
                    <div className="contacts-modal-window" onClick={(e) => e.stopPropagation()}>
                        <div className="contacts-modal-titlebar">
                            <div className="contacts-modal-window-controls">
                                <span />
                                <span />
                                <span />
                            </div>

                            <button className="contacts-modal-close" type="button" onClick={closePopup} aria-label="Close popup">
                                ×
                            </button>
                        </div>

                        <div className="contacts-modal-body">
                            <div className="contacts-modal-header">
                                <div className="contacts-modal-avatar">
                                    <img src={contactAvatars[selectedContact.id]} alt={selectedContact.email} />
                                </div>

                                <div className="contacts-modal-copy">
                                    <h2>{selectedContact.email}</h2>
                                    <p>{selectedContact.public_key?.x?.substring(0, 12) || 'Kunci publik tidak tersedia'}...</p>
                                    <span>
                                        {selectedContact.is_added
                                            ? 'Sudah tersimpan di daftar kontak.'
                                            : 'Kontak ini bisa langsung kamu simpan atau buka chat.'}
                                    </span>
                                </div>
                            </div>

                            {modalError && <div className="contacts-modal-error">{modalError}</div>}

                            <div className="contacts-modal-actions">
                                <button className="contacts-modal-button primary" type="button" onClick={handleGoToSelectedChat}>
                                    Langsung ke Chat
                                </button>

                                {!selectedContact.is_added && (
                                    <button
                                        className="contacts-modal-button secondary"
                                        type="button"
                                        onClick={handleAddSelectedContact}
                                        disabled={savingContact}
                                    >
                                        {savingContact ? 'Menyimpan...' : 'Tambah Kontak'}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="contacts-modal-backdrop" onClick={closePopup}>
                    <div className="contacts-modal-window contacts-modal-add" onClick={(e) => e.stopPropagation()}>
                        <div className="contacts-modal-titlebar">
                            <div className="contacts-modal-window-controls">
                                <span />
                                <span />
                                <span />
                            </div>

                            <button className="contacts-modal-close" type="button" onClick={closePopup} aria-label="Close popup">
                                ×
                            </button>
                        </div>

                        <form className="contacts-modal-body" onSubmit={handleAddContactSubmit}>
                            <div className="contacts-modal-header">
                                <div className="contacts-modal-copy full">
                                    <h2>Tambah Kontak</h2>
                                </div>
                            </div>

                            <label className="contacts-modal-field">
                                <span>Email kontak</span>
                                <input
                                    type="email"
                                    value={newContactEmail}
                                    onChange={(e) => setNewContactEmail(e.target.value)}
                                    placeholder="nama@email.com"
                                />
                            </label>

                            {addContactPreview && (
                                <div className="contacts-modal-header" style={{ marginTop: '20px' }}>
                                    <div className="contacts-modal-avatar">
                                        <img src={contactAvatars[addContactPreview.id]} alt={addContactPreview.email} />
                                    </div>

                                    <div className="contacts-modal-copy">
                                        <h2>{addContactPreview.email}</h2>
                                        <p>{addContactPreview.public_key?.x?.substring(0, 12) || 'Kunci publik tidak tersedia'}...</p>
                                        <span>
                                            {addContactPreview.is_added
                                                ? 'Sudah tersimpan di daftar kontak.'
                                                : 'Kontak ini bisa langsung kamu simpan.'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {modalError && <div className="contacts-modal-error">{modalError}</div>}

                            <div className="contacts-modal-actions">
                                <button
                                    className="contacts-modal-button primary"
                                    type="submit"
                                    disabled={savingContact || !addContactPreview || addContactPreview.is_added}
                                >
                                    {savingContact ? 'Menyimpan...' : 'Tambah Kontak'}
                                </button>

                                <button className="contacts-modal-button secondary" type="button" onClick={closePopup}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}