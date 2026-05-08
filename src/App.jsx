import { useEffect, useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import authService from './services/AuthService.js';
import CryptoClient from './services/CryptoClient.js';
import './App.css';

function App() {
    const [page, setPage] = useState('login');
    const [chatData, setChatData] = useState(null);

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
            setPage('chat');
        };

        restoreSession();
    }, []);

    const handleLoginSuccess = (userData) => {
        setChatData(userData);
        setPage('chat');
    };

    const handleLogout = () => {
        setChatData(null);
        setPage('login');
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

            {page === 'chat' && chatData && (
                <Chat
                    currentUser={chatData.user}
                    privateKey={chatData.privateKey}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}

export default App;