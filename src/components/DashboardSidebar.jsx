import profileIcon from '../assets/profileicon.png';
import kucingIcon from '../assets/kucing.png';
import blackCatIcon from '../assets/blackcat.png';
import maskCatIcon from '../assets/kucingtopeng.png';
import '../styling/DashboardSidebar.css';

const CAT_VARIANTS = {
    blackcat: blackCatIcon,
    kucing: kucingIcon,
    mask: maskCatIcon
};

export default function DashboardSidebar({ items, catVariant = 'kucing' }) {
    const catImage = CAT_VARIANTS[catVariant] || kucingIcon;

    return (
        <aside className="dashboard-sidebar">
            <div className="dashboard-brand">
                <img src={profileIcon} alt="meowchat" />
                <span>meowchat</span>
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