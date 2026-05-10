import axios from 'axios';
import authService from './AuthService';

class ChatService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/messages';
    }

    async getContacts() {
        try {
            const response = await axios.get(`${this.baseURL}/contacts`, {
                headers: authService.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.log(error.response?.data || error.toString());
            throw error;
        }
    }

    async getMessages(partnerId) {
        try {
            const response = await axios.get(`${this.baseURL}/conv/${partnerId}`, {
                headers: authService.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.log(error.response?.data || error.toString());
            throw error;
        }
    }

    async sendMessage(data) {
        try {
            const response = await axios.post(`${this.baseURL}/send`, data, {
                headers: authService.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.log(error.response?.data || error.toString());
            throw error;
        }
    }

    async addContact(data) {
        try {
            const response = await axios.post(`${this.baseURL}/contacts`, data, {
                headers: authService.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.log(error.response?.data || error.toString());
            throw error;
        }
    }
}

export default new ChatService();
