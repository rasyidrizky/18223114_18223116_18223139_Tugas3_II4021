import MessageModel from '../models/MessageModel.js';
import UserModel from '../models/UserModel.js';

class MessageController {
    constructor() {
        this.messageModel = new MessageModel();
        this.userModel = new UserModel();
    }

    // GET /api/messages/contacts
    // mengambil semua user lain sebagai daftar kontak
    getContacts = async (req, res) => {
        try {
            const currentUserId = Number(req.user.sub);
            const users = this.userModel.findAllExcept(currentUserId);

            const contacts = users.map(user => ({
                id: user.id,
                email: user.email,
                public_key: JSON.parse(user.public_key)
            }));

            res.status(200).json({ contacts });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '[DEBUG] Failed to fetch contacts' });
        }
    }

    // POST /api/messages/send
    // mengirim pesan terenkripsi
    sendMessage = async (req, res) => {
        try {
            const senderId = Number(req.user.sub);
            const { receiver_id, ciphertext, iv, mac } = req.body;

            if (!receiver_id || !ciphertext || !iv || !mac) {
                return res.status(400).json({ error: '[DEBUG] Missing message data' });
            }

            // Pastikan receiver ada
            const receiver = this.userModel.findById(Number(receiver_id));
            if (!receiver) {
                return res.status(404).json({ error: '[DEBUG] Receiver not found' });
            }

            this.messageModel.create({
                sender_id: senderId,
                receiver_id: Number(receiver_id),
                ciphertext,
                iv,
                mac
            });

            res.status(201).json({ message: '[DEBUG] Message sent' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '[DEBUG] Failed to send message' });
        }
    }

    // GET /api/messages/conv/:partnerId
    // mengambil semua pesan antara user yang login dan partner
    getMessages = async (req, res) => {
        try {
            const currentUserId = Number(req.user.sub);
            const partnerId = Number(req.params.partnerId);

            const messages = this.messageModel.getConversation(currentUserId, partnerId);

            res.status(200).json({ messages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '[DEBUG] Failed to fetch messages' });
        }
    }
}

export default MessageController;
