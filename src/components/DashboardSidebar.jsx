import { useEffect, useState } from 'react';
import profileIcon from '../assets/profileicon.png';
import kucingIcon from '../assets/kucing.png';
import blackCatIcon from '../assets/blackcat.png';
import maskCatIcon from '../assets/kucingtopeng.png';
import kucingGarukIcon from '../assets/kucinggaruk.png';

import avatar1 from '../assets/profile1.jpg';
import avatar2 from '../assets/profile2.jpg';
import avatar3 from '../assets/profile3.jpg';
import avatar4 from '../assets/profile4.jpg';
import avatar5 from '../assets/profile5.jpg';

import '../styling/DashboardSidebar.css';

const CAT_VARIANTS = {
    blackcat: blackCatIcon,
    kucing: kucingIcon,
    mask: maskCatIcon,
    kucinggaruk: kucingGarukIcon
};

const AVATAR_POOL = [avatar1, avatar2, avatar3, avatar4, avatar5];

export default function DashboardSidebar({ items, catVariant = 'kucing', currentUser }) {
    const catImage = CAT_VARIANTS[catVariant] || kucingIcon;
    const [sidebarName, setSidebarName] = useState('meowchat');
    const [sidebarAvatar, setSidebarAvatar] = useState(profileIcon);

    useEffect(() => {
        if (currentUser) {
            const defaultName = currentUser.email ? currentUser.email.split('@')[0] : 'Nama Pengguna';
            const savedProfile = localStorage.getItem(`profile_${currentUser.id}`);
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                const parsedName = parsed.name === 'Nama Pengguna' ? '' : parsed.name;
                setSidebarName(parsedName || defaultName);
                const defaultAvatar = AVATAR_POOL[parsed.avatarIndex !== undefined ? parsed.avatarIndex : currentUser.id % AVATAR_POOL.length];
                setSidebarAvatar(parsed.customAvatarUrl || defaultAvatar);
            } else {
                setSidebarName(defaultName);
                setSidebarAvatar(AVATAR_POOL[currentUser.id % AVATAR_POOL.length]);
            }
        }
    }, [currentUser]);

    return (
        <aside className="dashboard-sidebar">
            <div className="dashboard-brand">
                <img src={sidebarAvatar} alt={sidebarName} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{sidebarName}</span>
            </div>

            <div className="dashboard-sidebar-nav">
                {items.map((item) => (
                    <button
                        key={item.label}
                        className={`dashboard-sidebar-button ${item.active ? 'active' : ''}`}
                        type="button"
                        onClick={item.action}
                        disabled={!item.action}
                    >
                        <img className={item.iconClass || ''} src={item.icon} alt="" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className={`dashboard-sidebar-card variant-${catVariant}`}>
                <img className={`dashboard-sidebar-cat variant-${catVariant}`} src={catImage} alt="" />
            </div>
        </aside>
    );
}