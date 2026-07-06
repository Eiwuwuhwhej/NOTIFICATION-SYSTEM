# Notification System

A full-stack, tenant-aware notification system for an AI-native CRM platform. Backend API (Express + SQLite), React frontend with a notification bell UI, and trigger scripts to simulate real-world events.

## Quick Start

### Prerequisites
- **Node.js** 18+ (for built-in `fetch` and test runner)
- **npm** 9+

### Setup & Run

```bash
# 1. Install all dependencies (root + server + client)
npm run install:all

# 2. Start both server and client
npm run dev
```

This starts:
- **Backend** at `http://localhost:4000`
- **Frontend** at `http://localhost:5173`

The database is seeded automatically on startup with 4 sample notifications.

### Run Tests

```bash
npm test
```

Runs 16 tenant isolation tests verifying that users in one tenant cannot see, count, or mark-as-read notifications belonging to another tenant.

### Run Trigger Script (optional)

With the server running:

```bash
# Run both triggers (invite + reply)
node triggers/simulate.js

# Run just one
node triggers/simulate.js invite
node triggers/simulate.js reply
```

---

## Architecture

### Current Local Architecture

```
┌─────────────────────────────────────────┐
│            Frontend (React/Vite)         │
│  ┌───────────┐  ┌────────────────────┐  │
│  │ Bell Icon  │  │ Notification Panel │  │
│  │ + Badge    │  │ (list, mark read)  │  │
│  └───────────┘  └────────────────────┘  │
│       │ Poll 15s        │ API calls      │
└───────┼────────────────┼────────────────┘
        │                │
┌───────▼────────────────▼────────────────┐
│           Backend (Express)              │
│  POST /notifications     (create)        │
│  GET  /notifications     (list)          │
│  GET  /notifications/unread-count        │
│  PATCH /notifications/:id/read           │
│  PATCH /notifications/read-all           │
│  POST /triggers/invite   (demo)          │
│  POST /triggers/reply    (demo)          │
│                                          │
│  Auth: X-Tenant-Id + X-User-Id headers   │
│  DB:   SQLite (sql.js)                   │
└──────────────────────────────────────────┘
```

### Cloud Deployment Architecture (Planned)

We are currently planning to migrate this local setup to a **100% free cloud stack**:

1. **Frontend:** Hosted on [Vercel](https://vercel.com).
2. **Backend:** Hosted on [Render](https://render.com).
3. **Database:** Migrating from local `sql.js` to [Turso](https://turso.tech) (Remote SQLite) for data persistence across cloud deployments.

*Note: The codebase will be updated to decouple the frontend/backend and support this cloud architecture.*

### Auth Convention

Every API request must include two headers:
- `X-Tenant-Id` — scopes data to one organization
- `X-User-Id` — identifies the calling user

This is a simplified stand-in for JWT-based auth. The frontend includes an identity switcher dropdown to test different tenant/user combinations.

### Tenant Isolation

Every database query includes `tenant_id = ?` as a filter, ensuring:
- A user in tenant A never sees tenant B's notifications
- A user in tenant A cannot mark tenant B's notifications as read (returns 404)
- Unread counts and mark-all-read only affect the caller's tenant

---

## Project Structure

```
├── package.json              Root: concurrently runs server + client
├── README.md                 This file
├── INTEGRATION_WRITEUP.md    Integration write-up + future improvements
│
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js          Express entry point
│       ├── db.js             SQLite setup + seed data
│       ├── middleware/
│       │   └── auth.js       Header-based auth (stand-in for JWT)
│       ├── routes/
│       │   ├── notifications.js   5 notification endpoints
│       │   └── triggers.js        Trigger demo endpoints
│       └── tests/
│           └── tenant-isolation.test.js   16 automated tests
│
├── client/
│   ├── package.json
│   ├── vite.config.js        Vite + API proxy config
│   ├── index.html
│   └── src/
│       ├── main.jsx          React entry point
│       ├── App.jsx           Main layout + identity switcher
│       ├── index.css         Design system (dark mode, glassmorphism)
│       ├── api/
│       │   └── notifications.js   API client
│       ├── hooks/
│       │   └── useNotifications.js  State management + polling
│       ├── components/
│       │   ├── NotificationBell.jsx
│       │   ├── NotificationPanel.jsx
│       │   ├── NotificationItem.jsx
│       │   └── TriggerPanel.jsx
│       └── utils/
│           └── timeAgo.js
│
└── triggers/
    └── simulate.js           CLI trigger script
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notifications` | Create a notification |
| `GET` | `/notifications?page=1&limit=20` | List visible notifications (paginated, unread first) |
| `GET` | `/notifications/unread-count` | Unread count for badge |
| `PATCH` | `/notifications/:id/read` | Mark one as read |
| `PATCH` | `/notifications/read-all` | Mark all visible as read |
| `POST` | `/triggers/invite` | Demo: simulate team member invite |
| `POST` | `/triggers/reply` | Demo: simulate creator reply |
| `GET` | `/health` | Health check (no auth) |

### Example Request

```bash
curl -X GET http://localhost:4000/notifications \
  -H "X-Tenant-Id: t1" \
  -H "X-User-Id: u1"
```

---

## Seed Data

The database is seeded on startup with:

| ID | Tenant | User | Type | Read | Description |
|----|--------|------|------|------|-------------|
| n1 | t1 | null | member_invited | ❌ | Sarah joined Nova Talent |
| n2 | t1 | u1 | new_reply | ❌ | Priya Sharma replied |
| n3 | t1 | u1 | report_ready | ✅ | July campaign report ready |
| n4 | t2 | null | member_invited | ❌ | James joined Bright Star Agency |

**Expected visibility:**
- `t1/u1` sees: n1, n2, n3 (but never n4)
- `t1/u2` sees: n1 only
- `t2/*` sees: n4 only
