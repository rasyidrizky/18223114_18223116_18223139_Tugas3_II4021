import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import JwtLibrary from '../server/services/JwtLibrary.js';

function createKeyPair(algorithm) {
    const curveMap = {
        ES256: 'prime256v1',
        ES384: 'secp384r1',
        ES512: 'secp521r1'
    };

    const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: curveMap[algorithm],
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        },
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        }
    });

    return keyPair;
}

const algorithms = ['ES256', 'ES384', 'ES512'];

for (const algorithm of algorithms) {
    test(`sign and verify happy path for ${algorithm}`, () => {
        const { privateKey, publicKey } = createKeyPair(algorithm);
        const now = Math.floor(Date.now() / 1000);

        const token = JwtLibrary.sign({
            header: {
                alg: algorithm,
                typ: 'JWT'
            },
            claims: {
                iss: 'ii4021-chat-app',
                sub: '123',
                aud: 'ii4021-chat-client',
                iat: now,
                nbf: now,
                exp: now + 3600,
                jti: 'test-jti'
            },
            payload: {
                role: 'student'
            },
            privateKey
        });

        assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

        const decoded = JwtLibrary.verify({
            jwt: token,
            publicKey,
            options: {
                algs: [algorithm],
                iss: 'ii4021-chat-app',
                sub: '123',
                aud: 'ii4021-chat-client',
                jti: 'test-jti'
            }
        });

        assert.equal(decoded.header.alg, algorithm);
        assert.equal(decoded.header.typ, 'JWT');
        assert.equal(decoded.payload.role, 'student');
        assert.equal(decoded.payload.iss, 'ii4021-chat-app');
        assert.equal(decoded.payload.sub, '123');
        assert.equal(decoded.payload.aud, 'ii4021-chat-client');
    });
}

test('sign rejects missing header', () => {
    const { privateKey } = createKeyPair('ES256');

    assert.throws(() => {
        JwtLibrary.sign({
            payload: { foo: 'bar' },
            privateKey
        });
    }, /Header is required/);
});

test('sign rejects missing alg', () => {
    const { privateKey } = createKeyPair('ES256');

    assert.throws(() => {
        JwtLibrary.sign({
            header: {
                typ: 'JWT'
            },
            payload: { foo: 'bar' },
            privateKey
        });
    }, /Header alg is required/);
});

test('sign rejects invalid typ', () => {
    const { privateKey } = createKeyPair('ES256');

    assert.throws(() => {
        JwtLibrary.sign({
            header: {
                alg: 'ES256',
                typ: 'NOT_JWT'
            },
            payload: { foo: 'bar' },
            privateKey
        });
    }, /Header typ must be JWT/);
});

test('sign rejects unsupported algorithm', () => {
    const { privateKey } = createKeyPair('ES256');

    assert.throws(() => {
        JwtLibrary.sign({
            header: {
                alg: 'HS256',
                typ: 'JWT'
            },
            payload: { foo: 'bar' },
            privateKey
        });
    }, /Unsupported algorithm/);
});

test('sign rejects non-serializable payload', () => {
    const { privateKey } = createKeyPair('ES256');
    const payload = {};
    payload.self = payload;

    assert.throws(() => {
        JwtLibrary.sign({
            header: {
                alg: 'ES256',
                typ: 'JWT'
            },
            payload,
            privateKey
        });
    }, /Payload must be JSON serializable/);
});

test('verify rejects invalid token format', () => {
    const { publicKey } = createKeyPair('ES256');

    assert.throws(() => {
        JwtLibrary.verify({
            jwt: 'invalid-token',
            publicKey
        });
    }, /Invalid JWT format/);
});

test('verify rejects invalid encoding', () => {
    const { publicKey } = createKeyPair('ES256');

    assert.throws(() => {
        JwtLibrary.verify({
            jwt: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.invalid..',
            publicKey
        });
    }, /Invalid JWT format|Invalid JWT encoding/);
});

test('verify rejects invalid signature', () => {
    const keyPair1 = createKeyPair('ES256');
    const keyPair2 = createKeyPair('ES256');
    const now = Math.floor(Date.now() / 1000);

    const token = JwtLibrary.sign({
        header: {
            alg: 'ES256',
            typ: 'JWT'
        },
        claims: {
            iat: now,
            nbf: now,
            exp: now + 3600
        },
        payload: {
            role: 'student'
        },
        privateKey: keyPair1.privateKey
    });

    assert.throws(() => {
        JwtLibrary.verify({
            jwt: token,
            publicKey: keyPair2.publicKey,
            options: {
                algs: ['ES256']
            }
        });
    }, /Invalid JWT signature/);
});

test('verify rejects expired token', () => {
    const { privateKey, publicKey } = createKeyPair('ES256');
    const now = Math.floor(Date.now() / 1000);

    const token = JwtLibrary.sign({
        header: {
            alg: 'ES256',
            typ: 'JWT'
        },
        claims: {
            iat: now - 10,
            nbf: now - 10,
            exp: now - 1
        },
        payload: {
            role: 'student'
        },
        privateKey
    });

    assert.throws(() => {
        JwtLibrary.verify({
            jwt: token,
            publicKey,
            options: {
                algs: ['ES256']
            }
        });
    }, /JWT expired/);
});

test('verify rejects token that is not active yet', () => {
    const { privateKey, publicKey } = createKeyPair('ES256');
    const now = Math.floor(Date.now() / 1000);

    const token = JwtLibrary.sign({
        header: {
            alg: 'ES256',
            typ: 'JWT'
        },
        claims: {
            iat: now,
            nbf: now + 3600,
            exp: now + 7200
        },
        payload: {
            role: 'student'
        },
        privateKey
    });

    assert.throws(() => {
        JwtLibrary.verify({
            jwt: token,
            publicKey,
            options: {
                algs: ['ES256']
            }
        });
    }, /JWT not active yet/);
});

test('verify rejects mismatched issuer', () => {
    const { privateKey, publicKey } = createKeyPair('ES256');
    const now = Math.floor(Date.now() / 1000);

    const token = JwtLibrary.sign({
        header: {
            alg: 'ES256',
            typ: 'JWT'
        },
        claims: {
            iss: 'ii4021-chat-app',
            iat: now,
            nbf: now,
            exp: now + 3600
        },
        payload: {
            role: 'student'
        },
        privateKey
    });

    assert.throws(() => {
        JwtLibrary.verify({
            jwt: token,
            publicKey,
            options: {
                algs: ['ES256'],
                iss: 'different-issuer'
            }
        });
    }, /Invalid issuer/);
});