import { useEffect, useMemo, useState } from 'react';
import chatService from '../services/ChatService';
import '../styling/Dashboard.css';
import homeIcon from '../assets/home.png';
import friendIcon from '../assets/friend.png';
import chatIcon from '../assets/chat.png';
import profileIcon from '../assets/profileicon.png';
import logoutIcon from '../assets/iconlogout.png';
import protectionIcon from '../assets/proteksi.png';
import searchIcon from '../assets/search.png';
import catFlip from '../assets/kucingkebalik.png';
import avatar1 from '../assets/profile1.jpg';
import avatar2 from '../assets/profile2.jpg';
import avatar3 from '../assets/profile3.jpg';
import avatar4 from '../assets/profile4.jpg';
import avatar5 from '../assets/profile5.jpg';
import DashboardSidebar from '../components/DashboardSidebar.jsx';

const AVATAR_POOL = [avatar1, avatar2, avatar3, avatar4, avatar5];

export default function Dashboard({ currentUser, onGoToContacts, onGoToChat, onGoToProfile, onLogout }) {
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const data = await chatService.getContacts();
                setContacts(data.contacts || []);
            } catch (err) {
                console.error('[DEBUG] Failed to load dashboard contacts:', err);
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
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { label: 'Dashboard', icon: homeIcon, active: true },
        { label: 'Daftar Kontak', icon: friendIcon, action: onGoToContacts },
        { label: 'Chat', icon: chatIcon, action: onGoToChat },
        { label: 'Profile', icon: profileIcon, action: onGoToProfile },
        { label: 'Log Out', icon: logoutIcon, iconClass: 'dashboard-icon-logout', action: onLogout }
    ];

    const stats = [
        {
            label: 'Kontak',
            value: contacts.length,
            note: 'Lihat semua kontakmu',
            tone: 'green',
            icon: friendIcon
        },
        {
            label: 'Percakapan',
            value: Math.max(1, Math.min(contacts.length, 5)),
            note: 'Lanjutkan chat-mu',
            tone: 'violet',
            icon: chatIcon,
            iconClass: 'dashboard-icon-chat-stat'
        },
        {
            label: 'Aman',
            value: 'Terenkripsi',
            note: 'Pesanmu aman',
            tone: 'orange',
            icon: protectionIcon,
            iconClass: 'dashboard-icon-protection'
        }
    ];

    const activityItems = useMemo(() => {
        const timeLabels = ['10:30', '09:15', 'Kemarin'];

        return filteredContacts.slice(0, 3).map((contact, index) => ({
            id: contact.id,
            name: contact.email,
            text: index === 0 ? 'Hai! Selamat datang di MeowChat ✨' : index === 1 ? 'Oke, siap nanti!' : 'Thanks!',
            time: timeLabels[index],
            avatar: contactAvatars[contact.id]
        }));
    }, [contactAvatars, filteredContacts]);

    return (
        <section className="dashboard-page">
            <div className="dashboard-shell">
                <DashboardSidebar items={sidebarItems} catVariant="blackcat" currentUser={currentUser} />

                <main className="dashboard-main">
                    <section className="dashboard-hero">
                        <div className="dashboard-hero-copy">
                            <h1>Dashboard 👋</h1>
                            <p>Selamat datang kembali{currentUser?.email ? '!' : ''}</p>
                            <span>Ayo mulai ngobrol dengan teman-temanmu.</span>
                        </div>

                        <div className="dashboard-hero-visual">
                            <img className="dashboard-hero-cat" src={catFlip} alt="kucing kebalik" />
                            <button className="dashboard-menu-button" type="button" aria-label="menu">•••</button>
                        </div>
                    </section>

                    <section className="dashboard-stats">
                        {stats.map((stat) => (
                            <article key={stat.label} className={`dashboard-stat-card tone-${stat.tone}`}>
                                <div className="dashboard-stat-icon">
                                    <img className={stat.iconClass || ''} src={stat.icon} alt="" />
                                </div>
                                <div className="dashboard-stat-copy">
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                    <small>{stat.note}</small>
                                </div>
                            </article>
                        ))}
                    </section>

                    <section className="dashboard-activity-panel">
                        <div className="dashboard-panel-header">
                            <div>
                                <h2>Aktivitas Terbaru</h2>
                            </div>

                            <button className="dashboard-action-button" type="button" onClick={onGoToChat}>
                                Mulai Chat
                            </button>
                        </div>

                        <label className="dashboard-search">
                            <img src={searchIcon} alt="" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari kontak..."
                            />
                        </label>

                        {error && <div className="dashboard-error">{error}</div>}

                        <div className="dashboard-activity-list">
                            {activityItems.map((item) => (
                                <div key={item.id} className="dashboard-activity-item">
                                    <div className="dashboard-activity-avatar">
                                        <img src={item.avatar} alt={item.name} />
                                    </div>
                                    <div className="dashboard-activity-copy">
                                        <strong>{item.name}</strong>
                                        <span>{item.text}</span>
                                    </div>
                                    <div className="dashboard-activity-time">{item.time}</div>
                                </div>
                            ))}

                            {activityItems.length === 0 && !error && (
                                <div className="dashboard-empty">
                                    <strong>Belum ada aktivitas</strong>
                                    <span>Coba cari kontak lain atau buka chat.</span>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </section>
    );
}