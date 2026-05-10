import express from 'express';
import MessageController from '../controllers/MessageController.js';
import authMiddleware from '../services/AuthMiddleware.js';

const router = express.Router();
const messageController = new MessageController();

// semua endpoint dilindungi JWT middleware
router.get('/contacts', authMiddleware, messageController.getContacts);
router.post('/contacts', authMiddleware, messageController.addContact);
router.post('/send', authMiddleware, messageController.sendMessage);
router.get('/conv/:partnerId', authMiddleware, messageController.getMessages);

export default router;
