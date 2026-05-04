class CryptoClient {
    // encoder
    static enc = new TextEncoder();
    static dec = new TextDecoder();

    // convert buffer to base64
    static arraybuffer_to_Base64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    static base64_to_ArrayBuffer(base64) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes.buffer;
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

    static async decrypt_pk(encrypted_private_key, aes_iv, key_salt, password) {
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            this.enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const algorithm = {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: this.base64_to_ArrayBuffer(key_salt),
            iterations: 100000
        };

        const derivedKeyType = {
            name: "AES-GCM",
            length: 256
        };

        const keyUsage = ["decrypt"];

        const aes_key = await window.crypto.subtle.deriveKey(
            algorithm,
            keyMaterial,
            derivedKeyType,
            false,
            keyUsage
        );

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: this.base64_to_ArrayBuffer(aes_iv)
            },
            aes_key,
            this.base64_to_ArrayBuffer(encrypted_private_key)
        );

        const privateKeyJwk = JSON.parse(this.dec.decode(decrypted));

        return await window.crypto.subtle.importKey(
            "jwk",
            privateKeyJwk,
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            false,
            ["deriveKey", "deriveBits"]
        );
    }
}

export default CryptoClient;