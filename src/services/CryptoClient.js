class CryptoClient {
    // encoder
    static enc = new TextEncoder();

    // convert buffer to base64
    static arraybuffer_to_Base64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // key_salt generator
    static generate_salt(length = 16) {
        return window.crypto.getRandomValues(new Uint8Array(length));
    }

    // generate pasangan kunci ECDH
    static async generate_keypairECDH() {
        const algorithm = {name: "ECDH", namedCurve: "P-256"};
        const keyUsage = ["deriveKey", "deriveBits"];
        return await window.crypto.subtle.generateKey(algorithm, true, keyUsage);
    }

    // enkripsi kunci private
    static async encrypt_pk(private_key, password) {
        const export_key = await window.crypto.subtle.exportKey("jwk", private_key);
        const string_privateKey = JSON.stringify(export_key);

        // penurunan password jadi keyMaterial
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw", 
            this.enc.encode(password), 
            { name: "PBKDF2" }, 
            false, 
            ["deriveKey"]
        );

        const key_salt = this.generate_salt();
        
        // mekanisme kdf
        const algorithm = {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: key_salt,
            iterations: 100000
        };
        // kunci algoritma enkripsi
        const derivedKeyType = {
            name: "AES-GCM",
            length: 256
        };
        // penggunaan kunci
        const keyUsage = ["encrypt"];

        // secret key
        const aes_key = await window.crypto.subtle.deriveKey(algorithm, keyMaterial, derivedKeyType, false, keyUsage);

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedKey = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv},
            aes_key,
            this.enc.encode(string_privateKey),
        );

        return {
            ciphertext: this.arraybuffer_to_Base64(encryptedKey),
            iv: this.arraybuffer_to_Base64(iv),
            key_salt: this.arraybuffer_to_Base64(key_salt)
        };
    }
}

export default CryptoClient;