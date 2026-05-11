import db_instance from '../config/Database.js';

class ContactModel {
    constructor() {
        this.db = db_instance.getDatabase();
    }

    getContactsForUser(userId) {
        try {
            const command = this.db.prepare(
                `SELECT
                    u.id,
                    u.email,
                    u.public_key,
                    c.created_at AS added_at,
                    (
                        SELECT MAX(m.timestamp)
                        FROM messages m
                        WHERE (m.sender_id = c.user_id AND m.receiver_id = c.contact_id)
                           OR (m.sender_id = c.contact_id AND m.receiver_id = c.user_id)
                    ) AS last_message_at,
                    1 AS is_added
                 FROM contacts c
                 INNER JOIN user u
                    ON u.id = c.contact_id
                 WHERE c.user_id = ?
                 ORDER BY COALESCE(last_message_at, c.created_at) DESC, u.email ASC`
            );

            return command.all(userId);
        } catch (error) {
            console.log(error.toString());
            throw error;
        }
    }

    findByEmailForUser(userId, email) {
        try {
            const command = this.db.prepare(
                'SELECT id, email, public_key FROM user WHERE email = ? AND id != ?'
            );

            return command.get(email, userId);
        } catch (error) {
            console.log(error.toString());
            throw error;
        }
    }

    addContact(userId, contactId) {
        try {
            const command = this.db.prepare(
                'INSERT OR IGNORE INTO contacts (user_id, contact_id) VALUES (?, ?)'
            );

            return command.run(userId, contactId);
        } catch (error) {
            console.log(error.toString());
            throw error;
        }
    }

    isContactAdded(userId, contactId) {
        try {
            const command = this.db.prepare(
                'SELECT id FROM contacts WHERE user_id = ? AND contact_id = ?'
            );

            return Boolean(command.get(userId, contactId));
        } catch (error) {
            console.log(error.toString());
            throw error;
        }
    }
}

export default ContactModel;