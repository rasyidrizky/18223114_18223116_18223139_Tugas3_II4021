import axios from 'axios';

class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/auth';
        this.sessionKey = 'auth_session';
    }

    async register(payload) {
        try {
            const response = await axios.post(`${this.baseURL}/register`, payload);
            return response.data;
        } catch (error) {
            console.log(error.response?.data || error.toString());
            throw error;
        }
    }

    async login(payload) {
        try {
            const response = await axios.post(`${this.baseURL}/login`, payload);
            return response.data;
        } catch (error) {
            console.log(error.response?.data || error.toString());
            throw error;
        }
    }

    setToken(token) {
        localStorage.setItem('token', token);
    }

    setSession(session) {
        sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    getSession() {
        const rawSession = sessionStorage.getItem(this.sessionKey);

        if (!rawSession) {
            return null;
        }

        try {
            return JSON.parse(rawSession);
        } catch {
            return null;
        }
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getAuthHeader() {
        const token = this.getToken();

        return {
            Authorization: `Bearer ${token}`
        };
    }

    logout() {
        localStorage.removeItem('token');
        sessionStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem('email');
    }
}

export default new AuthService();