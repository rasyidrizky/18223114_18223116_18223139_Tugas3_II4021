CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hash_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    key_salt TEXT NOT NULL,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    aes_iv TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);