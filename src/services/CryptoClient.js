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
        const algorithm = { name: "ECDH", namedCurve: "P-256" };
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
            { name: "AES-GCM", iv: iv },
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

    // ECDH Key Exchange — derive shared secret dari private key sendiri + public key lawan
    static async deriveSharedSecret(privateKey, publicKeyJwk) {
        // import public key lawan bicara dari JWK
        const importedPublicKey = await window.crypto.subtle.importKey(
            "jwk",
            publicKeyJwk,
            { name: "ECDH", namedCurve: "P-256" },
            false,
            []
        );

        // derive 256-bit shared secret menggunakan ECDH
        const sharedSecretBits = await window.crypto.subtle.deriveBits(
            {
                name: "ECDH",
                public: importedPublicKey
            },
            privateKey,
            256
        );

        return sharedSecretBits;
    }

    // HKDF — turunkan AES-256 key dan HMAC key dari shared secret
    static async deriveAESKeyFromSecret(sharedSecret) {
        // import shared secret sebagai HKDF key material
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            sharedSecret,
            { name: "HKDF" },
            false,
            ["deriveKey"]
        );

        // salt statis untuk konsistensi antar dua pihak
        const salt = this.enc.encode("e2e-chat-salt-v1");

        // derive AES-256-GCM key
        const aesKey = await window.crypto.subtle.deriveKey(
            {
                name: "HKDF",
                hash: "SHA-256",
                salt: salt,
                info: this.enc.encode("aes-gcm-key")
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );

        // import ulang key material untuk derive HMAC key
        const keyMaterial2 = await window.crypto.subtle.importKey(
            "raw",
            sharedSecret,
            { name: "HKDF" },
            false,
            ["deriveKey"]
        );

        // derive HMAC key (SHA-256)
        const hmacKey = await window.crypto.subtle.deriveKey(
            {
                name: "HKDF",
                hash: "SHA-256",
                salt: salt,
                info: this.enc.encode("hmac-sha256-key")
            },
            keyMaterial2,
            { name: "HMAC", hash: "SHA-256", length: 256 },
            false,
            ["sign", "verify"]
        );

        return { aesKey, hmacKey };
    }

    // AES-256-GCM Encrypt + HMAC
    static async encryptMessage(aesKey, hmacKey, plaintext) {
        // generate random 12-byte IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // encrypt dengan AES-256-GCM
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            this.enc.encode(plaintext)
        );

        const ciphertextArray = new Uint8Array(ciphertextBuffer);

        // generate HMAC atas (IV + ciphertext) untuk integritas & autentikasi
        const dataToSign = new Uint8Array(iv.length + ciphertextArray.length);
        dataToSign.set(iv, 0);
        dataToSign.set(ciphertextArray, iv.length);

        const macBuffer = await window.crypto.subtle.sign(
            "HMAC",
            hmacKey,
            dataToSign
        );

        return {
            ciphertext: this.arraybuffer_to_Base64(ciphertextBuffer),
            iv: this.arraybuffer_to_Base64(iv),
            mac: this.arraybuffer_to_Base64(macBuffer)
        };
    }

    // verify HMAC + AES-256-GCM Decrypt
    static async decryptMessage(aesKey, hmacKey, ciphertext, iv, mac) {
        const ciphertextBuffer = this.base64_to_ArrayBuffer(ciphertext);
        const ivBuffer = new Uint8Array(this.base64_to_ArrayBuffer(iv));
        const macBuffer = this.base64_to_ArrayBuffer(mac);

        // rekonstruksi data yang di-sign: IV + ciphertext
        const ciphertextArray = new Uint8Array(ciphertextBuffer);
        const dataToVerify = new Uint8Array(ivBuffer.length + ciphertextArray.length);
        dataToVerify.set(ivBuffer, 0);
        dataToVerify.set(ciphertextArray, ivBuffer.length);

        // verifikasi HMAC terlebih dahulu
        const isValid = await window.crypto.subtle.verify(
            "HMAC",
            hmacKey,
            macBuffer,
            dataToVerify
        );

        if (!isValid) {
            throw new Error("HMAC verification failed — message integrity compromised");
        }

        // dekripsi AES-GCM
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            aesKey,
            ciphertextBuffer
        );

        return this.dec.decode(decryptedBuffer);
    }
}

export default CryptoClient;