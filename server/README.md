# SentinelX — Backend API

Real-Time Threat Monitoring Platform · MERN Stack · Node.js + Express + MongoDB + Socket.IO

---

## Quick Start

```bash
cd server
npm install
cp .env.example .env        # Fill in your values
npm run seed                 # Create admin user + default rules
npm run dev                  # Start with nodemon (dev)
npm start                    # Production
```

Server runs on: `http://localhost:5000`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Access token secret (32+ chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `INGEST_API_KEY` | Key for external system ingestion | — |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

---

## Default Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@sentinelx.dev | Admin@123456 |
| Analyst | analyst@sentinelx.dev | Analyst@123456 |

---

## API Reference

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Login, returns JWT |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| POST | `/api/v1/auth/logout` | JWT | Logout |
| GET | `/api/v1/auth/me` | JWT | Get current user |
| POST | `/api/v1/auth/register` | Admin | Create portal user |

### Event Ingestion (External Systems)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/events/ingest` | API_KEY | Ingest single event |
| POST | `/api/v1/events/ingest/batch` | API_KEY | Ingest up to 100 events |
| GET | `/api/v1/events` | JWT | Query events with filters |
| GET | `/api/v1/events/:id` | JWT | Get event by ID |

### Alerts
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/alerts` | JWT | List alerts |
| GET | `/api/v1/alerts/stats/summary` | JWT | Alert statistics |
| GET | `/api/v1/alerts/:id` | JWT | Get alert detail |
| PATCH | `/api/v1/alerts/:id/status` | Analyst+ | Update status |
| DELETE | `/api/v1/alerts/:id` | Admin | Delete alert |

### Users (Monitored)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users` | JWT | List monitored users |
| GET | `/api/v1/users/:id/risk` | JWT | Risk profile |
| GET | `/api/v1/users/:id/timeline` | JWT | Event timeline |
| PATCH | `/api/v1/users/:id/status` | Analyst+ | Update status |
| GET | `/api/v1/users/portal` | Admin | Portal user list |

### Rules
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/rules` | JWT | List rules |
| POST | `/api/v1/rules` | Admin | Create rule |
| PUT | `/api/v1/rules/:id` | Admin | Update rule |
| PATCH | `/api/v1/rules/:id/toggle` | Admin | Enable/disable |
| DELETE | `/api/v1/rules/:id` | Admin | Delete rule |

### Analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/analytics/overview` | JWT | Key metrics |
| GET | `/api/v1/analytics/threat-trend` | JWT | Hourly alert trend |
| GET | `/api/v1/analytics/top-risky-users` | JWT | Top 10 risky users |
| GET | `/api/v1/analytics/event-types` | JWT | Event type breakdown |
| GET | `/api/v1/analytics/geo-distribution` | JWT | Country distribution |
| GET | `/api/v1/analytics/alert-resolution` | JWT | Resolution stats |

---

## Event Ingestion Payload

```json
POST /api/v1/events/ingest
Headers: x-api-key: <INGEST_API_KEY>

{
  "externalUserId": "user_123",
  "sourceSystem": "my-web-app",
  "type": "login_failure",
  "ip": "203.0.113.42",
  "userAgent": "Mozilla/5.0...",
  "deviceId": "device_abc",
  "timestamp": "2025-01-15T10:30:00Z",
  "metadata": {
    "userName": "john.doe",
    "email": "john@example.com",
    "attemptCount": 3
  }
}
```

### Supported Event Types
`login_success` · `login_failure` · `logout` · `password_change` · `mfa_failure` · `mfa_success` · `device_change` · `location_change` · `permission_change` · `data_access` · `data_export` · `api_request` · `account_lockout` · `suspicious_request` · `custom`

---

## Detection Pipeline

```
Ingest → Enrich (Geo/Device) → Behavior Analysis → Risk Score → Alert Generation → Socket.IO Emit
```

**Risk Score Thresholds:**
- `0–39` → Low (no alert)
- `40–64` → Medium alert
- `65–84` → High alert
- `85–100` → Critical alert

---

## Socket.IO Events (Real-time)

Connect with JWT token:
```js
const socket = io("http://localhost:5000", { auth: { token: "<JWT>" } });
socket.on("new_alert", (data) => { /* handle alert */ });
socket.on("new_event", (data) => { /* handle live event */ });
socket.emit("subscribe_user", "user_123"); // subscribe to specific user
```

---

## Project Structure

```
server/
├── index.js                    # Entry point
├── src/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # Portal users (admin/analyst/viewer)
│   │   ├── MonitoredUser.js    # External users being monitored
│   │   ├── Event.js            # Activity log events
│   │   ├── Alert.js            # Generated security alerts
│   │   └── Rule.js             # Detection rules
│   ├── routes/                 # Express route handlers
│   ├── middleware/             # Auth, RBAC, rate limiting
│   ├── pipeline/               # Core detection engine
│   │   ├── index.js            # Pipeline orchestrator
│   │   ├── enricher.js         # Geo/device enrichment
│   │   ├── behaviorAnalyzer.js # Baseline comparison
│   │   ├── riskScorer.js       # Risk calculation
│   │   └── alertGenerator.js   # Alert creation
│   ├── services/
│   │   └── socket.service.js   # Socket.IO real-time
│   └── utils/
│       ├── logger.js           # Winston logger
│       └── seed.js             # DB seed script
```
