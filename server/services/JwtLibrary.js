import crypto from 'node:crypto';

const ALG_CONFIG = {
    ES256: {
        hash: 'sha256',
        keySize: 32
    },
    ES384: {
        hash: 'sha384',
        keySize: 48
    },
    ES512: {
        hash: 'sha512',
        keySize: 66
    }
};

class JwtLibrary {
    static base64urlEncode(input) {
        const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
        return buffer
            .toString('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    static base64urlDecode(input) {
        let value = input.replace(/-/g, '+').replace(/_/g, '/');
        while (value.length % 4) value += '=';
        return Buffer.from(value, 'base64');
    }

    static derToJose(signature, keySize) {
        const sig = Buffer.from(signature);
        let offset = 3;

        let rLength = sig[offset - 1];
        let r = sig.slice(offset, offset + rLength);
        offset += rLength + 1;

        let sLength = sig[offset - 1];
        let s = sig.slice(offset, offset + sLength);

        if (r[0] === 0x00 && r.length > keySize) r = r.slice(1);
        if (s[0] === 0x00 && s.length > keySize) s = s.slice(1);

        r = Buffer.concat([Buffer.alloc(Math.max(keySize - r.length, 0)), r]);
        s = Buffer.concat([Buffer.alloc(Math.max(keySize - s.length, 0)), s]);

        return Buffer.concat([r, s]);
    }

    static joseToDer(signature, keySize) {
        let r = signature.slice(0, keySize);
        let s = signature.slice(keySize);

        while (r.length > 1 && r[0] === 0x00) r = r.slice(1);
        while (s.length > 1 && s[0] === 0x00) s = s.slice(1);

        if (r[0] & 0x80) r = Buffer.concat([Buffer.from([0x00]), r]);
        if (s[0] & 0x80) s = Buffer.concat([Buffer.from([0x00]), s]);

        const totalLength = 2 + r.length + 2 + s.length;

        return Buffer.concat([
            Buffer.from([0x30, totalLength, 0x02, r.length]),
            r,
            Buffer.from([0x02, s.length]),
            s
        ]);
    }

    static sign({ header, claims = {}, payload = {}, privateKey }) {
        if (!header) throw new Error('Header is required');
        if (!header.alg) throw new Error('Header alg is required');
        if (header.typ !== 'JWT') throw new Error('Header typ must be JWT');
        if (!ALG_CONFIG[header.alg]) throw new Error('Unsupported algorithm');

        const config = ALG_CONFIG[header.alg];
        const finalPayload = { ...payload, ...claims };

        let encodedHeader;
        let encodedPayload;

        try {
            encodedHeader = this.base64urlEncode(JSON.stringify(header));
            encodedPayload = this.base64urlEncode(JSON.stringify(finalPayload));
        } catch {
            throw new Error('Payload must be JSON serializable');
        }

        const signingInput = `${encodedHeader}.${encodedPayload}`;

        const signer = crypto.createSign(config.hash);
        signer.update(signingInput);
        signer.end();

        const derSignature = signer.sign(privateKey);
        const joseSignature = this.derToJose(derSignature, config.keySize);

        return `${signingInput}.${this.base64urlEncode(joseSignature)}`;
    }

    static verify({ jwt, publicKey, options = {} }) {
        if (!jwt || typeof jwt !== 'string') {
            throw new Error('JWT must be a string');
        }

        const parts = jwt.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const [encodedHeader, encodedPayload, encodedSignature] = parts;

        let header;
        let payload;

        try {
            header = JSON.parse(this.base64urlDecode(encodedHeader).toString('utf8'));
            payload = JSON.parse(this.base64urlDecode(encodedPayload).toString('utf8'));
        } catch {
            throw new Error('Invalid JWT encoding');
        }

        if (!ALG_CONFIG[header.alg]) {
            throw new Error('Unsupported algorithm');
        }

        if (options.algs && !options.algs.includes(header.alg)) {
            throw new Error('JWT algorithm is not allowed');
        }

        const config = ALG_CONFIG[header.alg];
        const signingInput = `${encodedHeader}.${encodedPayload}`;
        const joseSignature = this.base64urlDecode(encodedSignature);
        const derSignature = this.joseToDer(joseSignature, config.keySize);

        const verifier = crypto.createVerify(config.hash);
        verifier.update(signingInput);
        verifier.end();

        const isValid = verifier.verify(publicKey, derSignature);

        if (!isValid) {
            throw new Error('Invalid JWT signature');
        }

        const now = Math.floor(Date.now() / 1000);

        if (!options.ignoreExp && payload.exp !== undefined && now >= payload.exp) {
            throw new Error('JWT expired');
        }

        if (!options.ignoreNbf && payload.nbf !== undefined && now < payload.nbf) {
            throw new Error('JWT not active yet');
        }

        if (options.iss && payload.iss !== options.iss) {
            throw new Error('Invalid issuer');
        }

        if (options.sub && payload.sub !== options.sub) {
            throw new Error('Invalid subject');
        }

        if (options.aud && payload.aud !== options.aud) {
            throw new Error('Invalid audience');
        }

        if (options.jti && payload.jti !== options.jti) {
            throw new Error('Invalid JWT ID');
        }

        return {
            header,
            payload,
            signature: encodedSignature
        };
    }
}

export default JwtLibrary;