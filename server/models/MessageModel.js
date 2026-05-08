import db_instance from '../config/Database.js'

class MessageModel {
    constructor() {
        this.db = db_instance.getDatabase();
    }

    create(data) {
        try {
            const command = this.db.prepare(
                'INSERT INTO messages (sender_id, receiver_id, ciphertext, iv, mac) VALUES (?, ?, ?, ?, ?)'
            );

            const result = command.run(
                data.sender_id,
                data.receiver_id,
                data.ciphertext,
                data.iv,
                data.mac
            );

            return result;
        } catch (error) {
            console.log(error.toString());
            throw error;
        }
    }

    getConversation(userId1, userId2) {
        try {
            const command = this.db.prepare(
                `SELECT id, sender_id, receiver_id, ciphertext, iv, mac, timestamp
                 FROM messages
                 WHERE (sender_id = ? AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = ?)
                 ORDER BY timestamp ASC`
            );

            const result = command.all(userId1, userId2, userId2, userId1);

            return result;
        } catch (error) {
            console.log(error.toString());
            throw error;
        }
    }
}

export default MessageModel;
