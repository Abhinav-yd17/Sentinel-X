# 🛡️ SentinelX — Real-Time Threat Monitoring Platform

A full-stack security monitoring system built with the **MERN Stack** that detects suspicious user behavior in real time.

![Stack](https://img.shields.io/badge/Stack-MERN-green)
![Node](https://img.shields.io/badge/Node.js-20-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Live Features

- 🔍 **Real-time threat detection** — brute force, impossible travel, geo anomalies
- 📊 **Live dashboard** — updates instantly via Socket.IO
- ⚡ **Risk scoring** — dynamic 0-100 score per user
- 🔔 **Auto alerts** — generated automatically on suspicious behavior
- 🛡️ **RBAC** — Admin, Analyst, Viewer roles
- ⚙️ **Custom rules** — configurable detection thresholds
- 📈 **Analytics** — charts, trends, geo distribution
- 🌍 **Geo-IP enrichment** — detects location from IP address

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Socket.IO Client |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt + RBAC |
| State Management | Zustand |
| HTTP Client | Axios with interceptors |

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/sentinelx.git
cd sentinelx
```

### 2. Install dependencies
```bash
npm install
npm run install-all
```

### 3. Configure environment
Create `server/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
INGEST_API_KEY=sentinelx_ingest_key
CLIENT_URL=http://localhost:3001
```

### 4. Seed database
```bash
npm run seed
```

### 5. Run both servers
```bash
npm run dev
```

Open **http://localhost:3001**

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@sentinelx.dev | Admin@123456 |
| Analyst | analyst@sentinelx.dev | Analyst@123456 |

## 📡 Event Ingestion API

External systems send activity logs via:
```bash
POST /api/v1/events/ingest
Headers: x-api-key: sentinelx_ingest_key

{
  "externalUserId": "user_001",
  "sourceSystem": "my-app",
  "type": "login_failure",
  "ip": "185.220.101.1",
  "metadata": { "userName": "john.doe" }
}
```

### Supported Event Types
`login_success` · `login_failure` · `logout` · `password_change` · `mfa_failure` · `device_change` · `location_change` · `data_access` · `data_export` · `api_request` · `suspicious_request`

## 🧠 Detection Pipeline
```
Event Received
     ↓
Enricher        → Adds geo-IP, device type
     ↓
Behavior Analyzer → Compares against user baseline
     ↓
Risk Scorer     → Calculates 0-100 risk score
     ↓
Anomaly Detector → Identifies attack patterns
     ↓
Alert Generator  → Creates alert if score >= 40
     ↓
Socket.IO       → Pushes to dashboard instantly
```

## 📁 Project Structure
```
sentinelx/
├── server/                 # Node.js + Express backend
│   └── src/
│       ├── models/         # MongoDB schemas (5 collections)
│       ├── routes/         # REST API endpoints (6 routers)
│       ├── pipeline/       # 5-stage detection engine
│       ├── middleware/     # Auth, RBAC, rate limiting
│       └── services/       # Socket.IO real-time service
└── client/                 # React 18 frontend
    └── src/
        ├── pages/          # 8 pages (Dashboard, Alerts, Events...)
        ├── components/     # Reusable UI components
        ├── hooks/          # useSocket real-time hook
        ├── store/          # Zustand auth state
        └── api/            # Axios API services
```

## 🔒 Security Features

- JWT authentication with silent auto-refresh
- bcrypt password hashing (12 salt rounds)
- Role-based access control (Admin/Analyst/Viewer)
- API rate limiting (100 req/15min)
- Helmet.js security headers
- CORS protection
- API key validation for event ingestion
- Input validation on all endpoints

## 📊 Pages

| Page | Description |
|---|---|
| Dashboard | Live stats, event feed, threat trend chart |
| Alerts | Manage and resolve security alerts |
| Events | Full activity log with filters |
| Users | Monitored users with risk profiles |
| Analytics | Charts, geo distribution, trends |
| Rules | Configure detection rules (Admin) |
| Team | Manage portal users (Admin) |