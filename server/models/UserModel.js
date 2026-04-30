import db_instance from '../config/Database.js'

class UserModel {
    constructor() {
        this.db = db_instance.getDatabase();
    }

    createUser(userData) {
        try {
            // create user data to DB
            const command = this.db.prepare('INSERT INTO user (email, hash_password, salt, key_salt, public_key, encrypted_private_key, aes_iv) VALUES (?, ?, ?, ?, ?, ?, ?)');

            const result = command.run(
                userData.email,
                userData.password_hash,
                userData.salt,
                userData.key_salt,
                JSON.stringify(userData.public_key),
                userData.encrypted_private_key,
                userData.aes_iv
            );

            return result;
        } catch (error) {
            console.log(error.toString());
        }
    }
}

export default UserModel;