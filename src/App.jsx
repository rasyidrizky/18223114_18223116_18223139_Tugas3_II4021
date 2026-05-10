import { useEffect, useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Contacts from './pages/Contacts.jsx';
import Chat from './pages/Chat.jsx';
import authService from './services/AuthService.js';
import CryptoClient from './services/CryptoClient.js';
import './App.css';

function App() {
    const [page, setPage] = useState('login');
    const [chatData, setChatData] = useState(null);
    const [chatTargetId, setChatTargetId] = useState(null);

    useEffect(() => {
        const restoreSession = async () => {
            const token = authService.getToken();
            const session = authService.getSession();

            if (!token || !session?.user || !session?.privateKey) {
                return;
            }

            const privateKey = await CryptoClient.importPrivateKeyJwk(session.privateKey);

            setChatData({
                user: session.user,
                privateKey
            });
            setPage('dashboard');
        };

        restoreSession();
    }, []);

    const handleLoginSuccess = (userData) => {
        setChatData(userData);
        setPage('dashboard');
    };

    const handleLogout = () => {
        setChatData(null);
        setPage('login');
    };

    const handleGoToChat = (contactId = null) => {
        setChatTargetId(contactId);
        setPage('chat');
    };

    const handleGoToContacts = () => {
        setChatTargetId(null);
        setPage('contacts');
    };

    const handleGoToDashboard = () => {
        setChatTargetId(null);
        setPage('dashboard');
    };

    return (
        <div className="auth-shell">
            {page === 'login' && (
                <Login
                    onGoToRegister={() => setPage('register')}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            {page === 'register' && (
                <Register onGoToLogin={() => setPage('login')} />
            )}

            {page === 'dashboard' && chatData && (
                <Dashboard
                    currentUser={chatData.user}
                    onGoToContacts={handleGoToContacts}
                    onGoToChat={handleGoToChat}
                    onLogout={handleLogout}
                />
            )}

            {page === 'contacts' && chatData && (
                <Contacts
                    currentUser={chatData.user}
                    onGoToDashboard={handleGoToDashboard}
                    onGoToChat={handleGoToChat}
                    onLogout={handleLogout}
                />
            )}

            {page === 'chat' && chatData && (
                <Chat
                    currentUser={chatData.user}
                    privateKey={chatData.privateKey}
                    initialContactId={chatTargetId}
                    onGoToDashboard={handleGoToDashboard}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}

export default App;