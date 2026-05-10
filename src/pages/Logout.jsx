import DashboardSidebar from '../components/DashboardSidebar.jsx';
import '../styling/Logout.css';
import homeIcon from '../assets/home.png';
import friendIcon from '../assets/friend.png';
import chatIcon from '../assets/chat.png';
import profileIcon from '../assets/profileicon.png';
import logoutIcon from '../assets/iconlogout.png';
import logoutEndIcon from '../assets/logoutend.png';
import pawIcon from '../assets/paw.png';

export default function Logout({ currentUser, onConfirmLogout, onCancel }) {
    const sidebarItems = [
        { label: 'Dashboard', icon: homeIcon, action: onCancel },
        { label: 'Daftar Kontak', icon: friendIcon, action: onCancel },
        { label: 'Chat', icon: chatIcon, action: onCancel },
        { label: 'Profile', icon: profileIcon, action: onCancel },
        { label: 'Log Out', icon: logoutIcon, iconClass: 'dashboard-icon-logout', active: true }
    ];

    return (
        <section className="logout-page">
            <div className="logout-shell">
                <DashboardSidebar items={sidebarItems} catVariant="kucinggaruk" currentUser={currentUser} />

                <main className="logout-main">
                    <div className="logout-panel">
                        <div className="logout-icon-wrapper">
                            <img src={logoutEndIcon} alt="Logout" className="logout-icon" />
                        </div>
                        
                        <h2 className="logout-title">Yakin ingin keluar?</h2>
                        <p className="logout-subtitle">Sampai jumpa lagi!</p>

                        <div className="logout-actions">
                            <button className="logout-confirm-btn" type="button" onClick={onConfirmLogout}>
                                Ya, Log Out <img src={pawIcon} alt="Paw" className="logout-paw-icon" />
                            </button>
                            <button className="logout-cancel-btn" type="button" onClick={onCancel}>
                                Batal
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </section>
    );
}
