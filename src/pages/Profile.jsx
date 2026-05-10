import { useMemo, useState, useEffect, useRef } from 'react';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import '../styling/Profile.css';
import homeIcon from '../assets/home.png';
import friendIcon from '../assets/friend.png';
import chatIcon from '../assets/chat.png';
import profileIcon from '../assets/profileicon.png';
import logoutIcon from '../assets/iconlogout.png';

import avatar1 from '../assets/profile1.jpg';
import avatar2 from '../assets/profile2.jpg';
import avatar3 from '../assets/profile3.jpg';
import avatar4 from '../assets/profile4.jpg';
import avatar5 from '../assets/profile5.jpg';

const AVATAR_POOL = [avatar1, avatar2, avatar3, avatar4, avatar5];

export default function Profile({ currentUser, onGoToDashboard, onGoToContacts, onGoToChat, onLogout }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('Nama Pengguna');
    const [avatarIndex, setAvatarIndex] = useState(0);
    const [customAvatarUrl, setCustomAvatarUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Load initial profile data from localStorage or fallback
    useEffect(() => {
        if (currentUser) {
            const savedProfile = localStorage.getItem(`profile_${currentUser.id}`);
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                setName(parsed.name || 'Nama Pengguna');
                setAvatarIndex(parsed.avatarIndex !== undefined ? parsed.avatarIndex : currentUser.id % AVATAR_POOL.length);
                setCustomAvatarUrl(parsed.customAvatarUrl || null);
            } else {
                setAvatarIndex(currentUser.id % AVATAR_POOL.length);
            }
        }
    }, [currentUser]);

    const handleSave = () => {
        if (currentUser) {
            localStorage.setItem(`profile_${currentUser.id}`, JSON.stringify({
                name: name.trim() || 'Nama Pengguna',
                avatarIndex,
                customAvatarUrl
            }));
        }
        setIsEditing(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomAvatarUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const sidebarItems = [
        { label: 'Dashboard', icon: homeIcon, action: onGoToDashboard },
        { label: 'Daftar Kontak', icon: friendIcon, action: onGoToContacts },
        { label: 'Chat', icon: chatIcon, action: onGoToChat },
        { label: 'Profile', icon: profileIcon, active: true },
        { label: 'Log Out', icon: logoutIcon, iconClass: 'dashboard-icon-logout', action: onLogout }
    ];

    const joinDate = useMemo(() => {
        if (!currentUser?.created_at) return '12 April 2026';
        const date = new Date(currentUser.created_at);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }, [currentUser]);

    return (
        <section className="profile-page">
            <div className="profile-shell">
                <DashboardSidebar items={sidebarItems} catVariant="mask" currentUser={currentUser} />

                <main className="profile-main">
                    <section className="profile-panel">
                        <div className="profile-header-title">
                            <h1>PROFILE</h1>
                        </div>

                        <div className="profile-content-scroll">
                            <div className="profile-avatar-section">
                                <div className="profile-avatar-wrapper">
                                    <img 
                                        src={customAvatarUrl || AVATAR_POOL[avatarIndex]} 
                                        alt="Profile" 
                                        className="profile-avatar-img" 
                                        style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                    {isEditing && (
                                        <>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                accept="image/*" 
                                                style={{ display: 'none' }} 
                                            />
                                            <button 
                                                className="profile-avatar-cam-btn" 
                                                type="button" 
                                                aria-label="Upload photo"
                                                onClick={handleCameraClick}
                                                title="Upload Foto"
                                            >
                                                📷
                                            </button>
                                        </>
                                    )}
                                </div>
                                <h2 className="profile-name">{name}</h2>
                                <p className="profile-email">{currentUser?.email || 'user@mail.com'}</p>
                            </div>

                            <div className="profile-details-card">
                                <div className="profile-detail-row">
                                    <span className="profile-detail-label">Nama Lengkap</span>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            className="profile-name-input"
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="profile-detail-value">{name}</span>
                                    )}
                                </div>
                                <div className="profile-detail-row">
                                    <span className="profile-detail-label">Email</span>
                                    <span className="profile-detail-value">{currentUser?.email || 'user@mail.com'}</span>
                                </div>
                                <div className="profile-detail-row">
                                    <span className="profile-detail-label">Bergabung Sejak</span>
                                    <span className="profile-detail-value">{joinDate}</span>
                                </div>
                            </div>

                            <div className="profile-actions">
                                {isEditing ? (
                                    <button className="profile-edit-btn save-btn" type="button" onClick={handleSave}>
                                        Simpan Profile <span>✓</span>
                                    </button>
                                ) : (
                                    <button className="profile-edit-btn" type="button" onClick={() => setIsEditing(true)}>
                                        Ubah Profile <span>✎</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </section>
    );
}
