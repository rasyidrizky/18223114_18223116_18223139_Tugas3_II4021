CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hash_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    key_salt TEXT NOT NULL,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    aes_iv TEXT NOT NULL,
    name TEXT,
    avatar_index INTEGER DEFAULT 0,
    custom_avatar_url TEXT,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    mac TEXT NOT NULL,
    timestamp DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (sender_id) REFERENCES user(id),
    FOREIGN KEY (receiver_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    UNIQUE(user_id, contact_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (contact_id) REFERENCES user(id)
);