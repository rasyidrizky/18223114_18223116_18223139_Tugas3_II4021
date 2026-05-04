import axios from 'axios';

class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/auth';
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
        sessionStorage.removeItem('email');
    }
}

export default new AuthService();