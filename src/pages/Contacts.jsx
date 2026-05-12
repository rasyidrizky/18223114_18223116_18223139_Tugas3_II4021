import { useEffect, useMemo, useState } from "react";
import chatService from "../services/ChatService";
import DashboardSidebar from "../components/DashboardSidebar.jsx";
import "../styling/Contacts.css";
import homeIcon from "../assets/home.png";
import friendIcon from "../assets/friend.png";
import chatIcon from "../assets/chat.png";
import profileIcon from "../assets/profileicon.png";
import logoutIcon from "../assets/iconlogout.png";
import searchIcon from "../assets/search.png";
import avatar1 from "../assets/profile1.jpg";
import avatar2 from "../assets/profile2.jpg";
import avatar3 from "../assets/profile3.jpg";
import avatar4 from "../assets/profile4.jpg";
import avatar5 from "../assets/profile5.jpg";

const AVATAR_POOL = [avatar1, avatar2, avatar3, avatar4, avatar5];

export default function Contacts({
  currentUser,
  onGoToDashboard,
  onGoToChat,
  onGoToProfile,
  onLogout,
}) {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await chatService.getContacts();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error("Failed to load contacts page contacts:", err);
        setError("Gagal memuat daftar kontak.");
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
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openContactPopup = (contact) => {
    setSelectedContact(contact);
  };

  const closePopup = () => {
    setSelectedContact(null);
  };

  const handleGoToSelectedChat = () => {
    if (!selectedContact) {
      return;
    }

    onGoToChat(selectedContact.id);
  };

  const sidebarItems = [
    { label: "Dashboard", icon: homeIcon, action: onGoToDashboard },
    { label: "Daftar Kontak", icon: friendIcon, active: true },
    { label: "Chat", icon: chatIcon, action: onGoToChat },
    { label: "Profile", icon: profileIcon, action: onGoToProfile },
    {
      label: "Log Out",
      icon: logoutIcon,
      iconClass: "dashboard-icon-logout",
      action: onLogout,
    },
  ];

  return (
    <section className="contacts-page">
      <div className="contacts-shell">
        <DashboardSidebar
          items={sidebarItems}
          catVariant="kucing"
          currentUser={currentUser}
        />

        <main className="contacts-main">
          <section className="contacts-panel">
            <div className="contacts-header">
              <div className="contacts-title">
                <h1>Daftar Kontak</h1>
                <p>
                  {currentUser?.email || "MeowChat"} • {filteredContacts.length}{" "}
                  pengguna terdaftar
                </p>
              </div>
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
                  </div>

                  <div
                    className={`contacts-card-status ${contact.id % 2 === 0 ? "online" : ""}`}
                  />
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      {selectedContact && (
        <div className="contacts-modal-backdrop" onClick={closePopup}>
          <div
            className="contacts-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="contacts-modal-titlebar">
              <div className="contacts-modal-window-controls">
                <span />
                <span />
                <span />
              </div>

              <button
                className="contacts-modal-close"
                type="button"
                onClick={closePopup}
                aria-label="Close popup"
              >
                ×
              </button>
            </div>

            <div className="contacts-modal-body">
              <div className="contacts-modal-header">
                <div className="contacts-modal-avatar">
                  <img
                    src={contactAvatars[selectedContact.id]}
                    alt={selectedContact.email}
                  />
                </div>

                <div className="contacts-modal-copy">
                  <h2>{selectedContact.email}</h2>
                  <p>
                    {selectedContact.public_key?.x?.substring(0, 12) ||
                      "Kunci publik tidak tersedia"}
                    ...
                  </p>
                  <span>Klik tombol di bawah untuk mulai chat.</span>
                </div>
              </div>

              <div className="contacts-modal-actions">
                <button
                  className="contacts-modal-button primary"
                  type="button"
                  onClick={handleGoToSelectedChat}
                >
                  Langsung ke Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
