import { useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './App.css';

function App() {
    const [page, setPage] = useState('login');

    return (
        <div className="auth-shell">
            {page === 'login' && (
                <Login onGoToRegister={() => setPage('register')} />
            )}

            {page === 'register' && (
                <Register onGoToLogin={() => setPage('login')} />
            )}
        </div>
    );
}

export default App;