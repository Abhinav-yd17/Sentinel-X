# SentinelX — Complete MERN Stack Project

Real-Time Threat Monitoring Platform

## Project Structure

```
sentinelx/
├── server/     ← Node.js + Express + MongoDB backend
└── client/     ← React + Vite frontend
```

## Quick Start

### 1. Start Backend
```bash
cd server
npm install
cp .env.example .env      # Fill in MONGO_URI and secrets
npm run seed              # Creates admin user + default rules
npm run dev               # Runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd client
npm install
npm run dev               # Runs on http://localhost:3000
```

### 3. Open App
Visit: http://localhost:3000

Login credentials (after seed):
- Admin:   admin@sentinelx.dev   / Admin@123456
- Analyst: analyst@sentinelx.dev / Analyst@123456

## Environment Variables (server/.env)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/sentinelx
JWT_SECRET=your_32_char_secret_here
JWT_REFRESH_SECRET=another_32_char_secret
INGEST_API_KEY=sentinelx_ingest_key
CLIENT_URL=http://localhost:3000
```

## Ingesting Test Events (External API)

```bash
curl -X POST http://localhost:5000/api/v1/events/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: sentinelx_ingest_key" \
  -d '{
    "externalUserId": "user_001",
    "sourceSystem": "my-app",
    "type": "login_failure",
    "ip": "203.0.113.42",
    "metadata": { "userName": "john.doe" }
  }'
```
