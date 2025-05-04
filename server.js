// FILE: backend/server.js
const express = require("express");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
const cors = require("cors");

const app = express();
const redis = new Redis();

app.use(cors());
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname, "index.html")));

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Generate RSA key pair
function generateKeyPair() {
  return crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

// Route: Generate UUID + RSA key pair
app.post("/generate-key", async (req, res) => {
  const uuid = uuidv4();
  const { publicKey, privateKey } = generateKeyPair();

  await redis.set(`uuid:${uuid}:private_key`, privateKey, "EX", 600); // 10 min expiry
  await redis.del(`uuid:${uuid}:all_values`, `uuid:${uuid}:unique_values`);

  res.json({ uuid, publicKey });
});

// Route: Submit encrypted value
app.post("/submit", async (req, res) => {
  const { uuid, encryptedValue } = req.body;
  const encHash = crypto
    .createHash("sha256")
    .update(encryptedValue)
    .digest("hex");

  const allKey = `uuid:${uuid}:all_values`;
  const uniqueKey = `uuid:${uuid}:unique_values`;

  const isDuplicate = await redis.sismember(allKey, encHash);

  await redis.sadd(allKey, encHash);
  if (!isDuplicate) await redis.sadd(uniqueKey, encryptedValue);

  const count = await redis.scard(allKey);
  if (count < 15)
    return res.json({ message: "Value received", complete: false });

  const privateKey = await redis.get(`uuid:${uuid}:private_key`);
  if (!privateKey)
    return res.status(410).json({ error: "Private key expired or not found" });

  const values = await redis.smembers(uniqueKey);
  const decrypted = values
    .map((val) => {
      try {
        const buf = Buffer.from(val, "base64");
        const dec = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
          },
          buf
        );
        return parseFloat(dec.toString());
      } catch (error) {
        console.error("Decryption error:", error);
        return null;
      }
    })
    .filter((val) => val !== null);

  const sorted = decrypted.sort((a, b) => b - a);
  res.json({ sorted, complete: true });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
