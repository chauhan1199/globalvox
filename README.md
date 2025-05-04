# Secure Value Collection System

A Node.js backend service that securely collects encrypted values using RSA encryption and Redis for temporary storage.

## Features

- RSA key pair generation for secure data transmission
- Temporary key storage using Redis
- Duplicate value detection
- Automatic value decryption and sorting
- CORS enabled for cross-origin requests

## Prerequisites

- Node.js
- Redis server
- NPM package manager

## Dependencies

- Express.js - Web application framework
- ioredis - Redis client for Node.js
- crypto - Node.js built-in cryptography module
- uuid - Unique identifier generation
- cors - Cross-Origin Resource Sharing middleware

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install

## Run server
npm run dev


## Run server
npm start


## API Endpoints
1 Generate Key Pair
POST /generate-key
Description: Generates a new RSA key pair and stores the public key in Redis.
Request Body: None
Response: JSON object containing the generated public key.
{
    "uuid": "generated-uuid",
    "publicKey": "public-key-pem"
}


2 Submit Encrypted Value
POST /submit
Submit an encrypted value for processing.
Request Body: JSON object containing the encrypted value and the UUID.
{
    "uuid": "generated-uuid",
    "encryptedValue": "base64-encoded-encrypted-value"
}

Response: JSON object containing the decrypted and sorted values If less than 15 values received.
{
    "message": "Value received",
    "complete": false
}

Response: JSON object containing the decrypted and sorted values If 15 values received.
{
  "sorted": [
    1.14,
    1.13,
    1.12,
    1.11,
    1.1,
    1.09,
    1.08,
    1.07,
    1.06,
    1.05,
    1.04,
    1.03,
    1.02,
    1.01,
    1
  ],
  "complete": true
}
```
