import MessageModel from "../models/MessageModel.js";
import UserModel from "../models/UserModel.js";
import ContactModel from "../models/ContactModel.js";

class MessageController {
  constructor() {
    this.messageModel = new MessageModel();
    this.userModel = new UserModel();
    this.contactModel = new ContactModel();
  }

  // GET /api/messages/conv-count
  // menghitung jumlah percakapan unik (partner berbeda) milik user yang login
  getConversationCount = async (req, res) => {
    try {
      const currentUserId = Number(req.user.sub);
      const count = this.messageModel.getConversationCount(currentUserId);
      res.status(200).json({ count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to get conversation count" });
    }
  };

  // GET /api/messages/contacts
  // mengambil semua user terdaftar (selain user yang sedang login) sebagai daftar kontak
  getContacts = async (req, res) => {
    try {
      const currentUserId = Number(req.user.sub);
      const users = this.userModel.findAllExcept(currentUserId);

      const contacts = users.map((user) => ({
        id: user.id,
        email: user.email,
        public_key: JSON.parse(user.public_key),
        name: user.name || null,
        avatar_index: user.avatar_index || null,
      }));

      res.status(200).json({ contacts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  };

  // GET /api/messages/search?email=...
  // mencari user berdasarkan email untuk ditambahkan sebagai kontak
  searchUser = async (req, res) => {
    try {
      const currentUserId = Number(req.user.sub);
      const email = req.query.email?.trim().toLowerCase();

      if (!email) {
        return res.status(400).json({ error: "Email parameter is required" });
      }

      const user = this.contactModel.findByEmailForUser(currentUserId, email);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isAdded = this.contactModel.isContactAdded(currentUserId, user.id);

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          public_key: JSON.parse(user.public_key),
          is_added: isAdded,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to search user" });
    }
  };

  // POST /api/messages/contacts
  // menambahkan kontak ke daftar user yang login
  addContact = async (req, res) => {
    try {
      const currentUserId = Number(req.user.sub);
      const { contact_id, email } = req.body;

      let contact = null;

      if (contact_id) {
        contact = this.userModel.findById(Number(contact_id));
      } else if (email) {
        contact = this.contactModel.findByEmailForUser(currentUserId, email);
      }

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (Number(contact.id) === currentUserId) {
        return res
          .status(400)
          .json({ error: "Cannot add yourself as a contact" });
      }

      if (this.contactModel.isContactAdded(currentUserId, Number(contact.id))) {
        return res.status(409).json({
          error: "Contact already added",
          contact: {
            id: contact.id,
            email: contact.email,
            public_key: JSON.parse(contact.public_key),
            is_added: true,
          },
        });
      }

      this.contactModel.addContact(currentUserId, Number(contact.id));

      res.status(201).json({
        message: "Contact added",
        contact: {
          id: contact.id,
          email: contact.email,
          public_key: JSON.parse(contact.public_key),
          is_added: true,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add contact" });
    }
  };

  // POST /api/messages/send
  // mengirim pesan terenkripsi
  sendMessage = async (req, res) => {
    try {
      const senderId = Number(req.user.sub);
      const { receiver_id, ciphertext, iv, mac } = req.body;

      if (!receiver_id || !ciphertext || !iv || !mac) {
        return res.status(400).json({ error: "Missing message data" });
      }

      // Pastikan receiver ada
      const receiver = this.userModel.findById(Number(receiver_id));
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }

      this.messageModel.create({
        sender_id: senderId,
        receiver_id: Number(receiver_id),
        ciphertext,
        iv,
        mac,
      });

      res.status(201).json({ message: "Message sent" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message" });
    }
  };

  // GET /api/messages/conv/:partnerId
  // mengambil semua pesan antara user yang login dan partner
  getMessages = async (req, res) => {
    try {
      const currentUserId = Number(req.user.sub);
      const partnerId = Number(req.params.partnerId);

      const messages = this.messageModel.getConversation(
        currentUserId,
        partnerId,
      );

      res.status(200).json({ messages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  };
}

export default MessageController;
