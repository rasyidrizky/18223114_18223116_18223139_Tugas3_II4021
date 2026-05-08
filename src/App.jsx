import { useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import './App.css';

function App() {
    const [page, setPage] = useState('login');
    const [chatData, setChatData] = useState(null);

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