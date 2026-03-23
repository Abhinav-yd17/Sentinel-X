# SentinelX — Frontend (React + Vite)

## Quick Start

```bash
cd client
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

> The Vite dev server proxies `/api/*` and `/socket.io` to `http://localhost:5000` automatically.
> Make sure the backend is running first!

---

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Dashboard | All roles |
| `/alerts` | Alert management | All roles |
| `/events` | Event log | All roles |
| `/users` | Monitored users | All roles |
| `/analytics` | Charts & insights | All roles |
| `/rules` | Detection rules | Admin only |
| `/team` | Portal user management | Admin only |

---

## Tech Stack

- **React 18** + **Vite** — fast dev server + build
- **React Router v6** — client-side routing
- **Zustand** — lightweight auth state management
- **Axios** — HTTP client with JWT interceptors + auto-refresh
- **Socket.IO client** — real-time alerts and live event feed
- **Recharts** — analytics charts
- **Tailwind CSS** — utility-first styling
- **React Hot Toast** — notifications
- **date-fns** — date formatting

---

## Backend Connection

The frontend connects to the backend via:

1. **REST API** — all pages fetch data via `src/api/services.js`
2. **Socket.IO** — `src/hooks/useSocket.js` connects on login for live events/alerts
3. **JWT Auth** — stored in `localStorage`, auto-refreshed via Axios interceptor

### Environment (optional)
By default Vite proxies to `localhost:5000`. To point to a different backend:

```js
// vite.config.js — change the proxy target
proxy: {
  '/api': { target: 'http://your-backend:5000' }
}
```

---

## Project Structure

```
client/src/
├── api/
│   ├── axios.config.js     # Axios instance + JWT interceptors
│   └── services.js         # All API calls (auth, events, alerts…)
├── components/
│   ├── Layout.jsx          # App shell with sidebar
│   ├── Sidebar.jsx         # Navigation + user info
│   └── UI.jsx              # Shared: badges, cards, table, spinner
├── hooks/
│   └── useSocket.js        # Socket.IO real-time hook
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx       # Overview + live feed
│   ├── Alerts.jsx          # Alert management + resolve
│   ├── Events.jsx          # Event log with filters
│   ├── Users.jsx           # Monitored users + risk profiles
│   ├── Analytics.jsx       # Charts and insights
│   ├── Rules.jsx           # Detection rule CRUD
│   └── Team.jsx            # Portal user management
├── store/
│   └── authStore.js        # Zustand auth state
└── utils/
    └── helpers.js          # Formatters, color helpers
```
