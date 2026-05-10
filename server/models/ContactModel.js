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
                    CASE WHEN c.contact_id IS NULL THEN 0 ELSE 1 END AS is_added
                 FROM user u
                 LEFT JOIN contacts c
                    ON c.user_id = ? AND c.contact_id = u.id
                 WHERE u.id != ?
                 ORDER BY is_added DESC, u.email ASC`
            );

            return command.all(userId, userId);
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