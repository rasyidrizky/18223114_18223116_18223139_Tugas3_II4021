import fs from "node:fs";
import JwtLibrary from "./JwtLibrary.js";
import CryptoServer from "./CryptoServer.js";

const jwtAlg = ["ES256", "ES384", "ES512"].includes(process.env.JWT_ALG)
  ? process.env.JWT_ALG
  : "ES256";
const jwtPublicKeyPath =
  jwtAlg === "ES256"
    ? "server/jwt_public.pem"
    : `server/jwt_${jwtAlg.toLowerCase()}_public.pem`;
const jwtPrivateKeyPath =
  jwtAlg === "ES256"
    ? "server/jwt_private.pem"
    : `server/jwt_${jwtAlg.toLowerCase()}_private.pem`;

if (!fs.existsSync(jwtPrivateKeyPath) || !fs.existsSync(jwtPublicKeyPath)) {
  const { privateKey, publicKey } = CryptoServer.generateJwtKeyPair();
  fs.writeFileSync(jwtPrivateKeyPath, privateKey);
  fs.writeFileSync(jwtPublicKeyPath, publicKey);
}

const jwtPublicKey = fs.readFileSync(jwtPublicKeyPath, "utf8");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = JwtLibrary.verify({
      jwt: token,
      publicKey: jwtPublicKey,
      options: {
        algs: [jwtAlg],
        iss: "ii4021-chat-app",
        aud: "ii4021-chat-client",
      },
    });

    req.user = decoded.payload;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

export default authMiddleware;
