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
            console.log(error.toString());
        }
    }
}

export default new AuthService();