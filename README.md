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

---

## How it Works

The notification system consists of a backend API and a frontend React client.
1. **Database**: A Turso (Remote SQLite) database stores notifications. Each notification has a `tenant_id` (organization) and an optional `user_id` (if the notification is directed to a specific person). If `user_id` is null, it's a team-wide notification.
2. **Backend**: An Express API handles creating, fetching, and updating notifications. It enforces tenant isolation on every request by requiring `X-Tenant-Id` and `X-User-Id` headers.
3. **Frontend**: The React app (built with Vite) periodically polls the backend every 15 seconds to fetch the latest unread notifications and the unread count. It displays these in a dropdown panel attached to a bell icon.
4. **Triggers**: Events like "Team Member Invited" or "New Reply" can be fired from the UI or via scripts. These hit the `/triggers` endpoints, which then insert new rows into the notification table.

---

## Integration & Future Improvements

*(Transitioning from a standalone full-stack app into a decoupled microservice)*

### Part 1: Integration (Fitting into a Larger System)

#### 1. Authentication & Identity
**What changes:** The system currently trusts the `X-Tenant-Id` and `X-User-Id` headers implicitly. In a real system, we would place this notification service behind the company's existing API Gateway. The Gateway would validate the user's JWT, securely extract the `tenantId` and `userId`, and inject them into the headers before forwarding the request. The internal notification code remains entirely unchanged.

#### 2. Event Triggers (Decoupling)
**What changes:** We would introduce an asynchronous Message Broker (like RabbitMQ, Kafka, or AWS EventBridge). When an event occurs (e.g., a creator replies), the Messaging Service publishes a `CreatorReplied` event to the broker. Our Notification Service runs a background worker that subscribes to this topic, transforms the event into our standard Notification model, and saves it to the database. This ensures the core CRM doesn't crash if the notification database goes down.

#### 3. Database Architecture
**What stays:** We would keep the notifications in their own isolated table (or entirely separate database) to prevent notification queries from competing for resources with core CRM data. The strict composite indexing on `(tenantId, userId, read, createdAt)` would remain critical.

### Part 2: What we would do differently with more time
*(Technical and UX enhancements for a larger scale deployment)*

#### 1. WebSockets / Server-Sent Events (SSE)
Currently, the React client polls the server every 15 seconds. While functional, this wastes bandwidth when the system is idle. We would upgrade this to WebSockets (or SSE) to push events to the client instantly.

#### 2. Cursor-Based Pagination
The `GET /notifications` endpoint currently uses offset/limit pagination. For a system with thousands of historical notifications per user, this gets slow. We would refactor the query to use cursor-based pagination (e.g., `WHERE createdAt < last_seen_date`) for consistent performance.

#### 3. Notification Grouping / Rollups
If a user goes on vacation and 10 people reply to a campaign, the UI will show 10 separate rows. We would add a grouping engine to aggregate these into a single notification: *"Sarah and 9 others replied to your campaign"*, preventing notification fatigue.

#### 4. Delivery Preferences
We would introduce a `notification_preferences` table, allowing users to mute specific types (e.g., turn off "member_invited" alerts) or route them to different channels (Push, Email, Slack) instead of just in-app.
