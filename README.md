# Notification Management System

A simple yet powerful notification management system built with **Express.js**. This backend service manages user notifications with multi-tenant support, persistent storage, and real-time notification tracking.

## Features

- ✅ **Multi-tenant Support** - Isolate notifications by tenant ID
- ✅ **User-Specific Notifications** - Send notifications to individual users or broadcast to all users in a tenant
- ✅ **Read Status Tracking** - Mark notifications as read individually or in bulk
- ✅ **Unread Count API** - Get quick count of unread notifications
- ✅ **Persistent Storage** - Store notifications in JSON file
- ✅ **Demo Event Generation** - Auto-generate demo notifications for testing
- ✅ **RESTful API** - Easy-to-use HTTP endpoints
- ✅ **Static Frontend Serving** - Serves frontend files automatically

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Storage**: JSON File-based database
- **Port**: 3000 (configurable via `PORT` environment variable)

## Project Structure

```
backend/
├── server.js                          # Main application entry point
├── package.json                       # Dependencies and metadata
├── controllers/
│   └── notificationsController.js    # Request handlers for notification endpoints
├── routes/
│   └── notifications.js               # API route definitions
├── services/
│   └── notificationService.js         # Business logic for notifications
└── data/
    └── notifications.json             # Persistent notification storage
```

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

## API Endpoints

### Create a Notification
**POST** `/notifications`

Creates a new notification for a specific user or broadcasts to all users in a tenant.

**Request Headers**:
- `x-tenant-id`: Tenant identifier (default: `t1`)
- `x-user-id`: User identifier (default: `u1`)

**Request Body**:
```json
{
  "tenantId": "t1",
  "userId": null,
  "type": "custom_event",
  "title": "Notification Title",
  "body": "Notification message content"
}
```

**Response**:
```json
{
  "id": "n1234567890",
  "tenantId": "t1",
  "userId": null,
  "type": "custom_event",
  "title": "Notification Title",
  "body": "Notification message content",
  "read": false,
  "createdAt": "2026-07-06T10:30:00.000Z"
}
```

### Get All Notifications
**GET** `/notifications`

Retrieves all notifications for the current user/tenant with unread items appearing first.

**Query Parameters**: None

**Response**:
```json
[
  {
    "id": "n1234567890",
    "tenantId": "t1",
    "userId": "u1",
    "type": "member_joined",
    "title": "New Member Joined",
    "body": "John Doe joined your community",
    "read": false,
    "createdAt": "2026-07-06T10:30:00.000Z"
  }
]
```

### Get Unread Count
**GET** `/notifications/unread-count`

Returns the count of unread notifications for the current user/tenant.

**Response**:
```json
{
  "count": 5
}
```

### Mark Single Notification as Read
**PATCH** `/notifications/:id/read`

Marks a specific notification as read.

**Response**:
```json
{
  "id": "n1234567890",
  "read": true
}
```

### Mark All Notifications as Read
**PATCH** `/notifications/read-all`

Marks all unread notifications as read for the current user/tenant.

**Response**:
```json
{
  "updated": 5
}
```

### Create Demo: Member Joined Event
**POST** `/notifications/demo/member-joined`

Creates a demo "member_joined" notification for testing purposes.

### Create Demo: Creator Replied Event
**POST** `/notifications/demo/creator-replied`

Creates a demo "creator_replied" notification for testing purposes.

## Multi-Tenant & User Headers

The system uses custom headers to isolate data by tenant and user:

- **`x-tenant-id`**: Identifies the tenant (defaults to `t1` if not provided)
- **`x-user-id`**: Identifies the user within a tenant (defaults to `u1` if not provided)

All requests should include these headers for proper multi-tenant isolation.

**Example with cURL**:
```bash
curl -X GET http://localhost:3000/notifications \
  -H "x-tenant-id: tenant-123" \
  -H "x-user-id: user-456"
```

## Data Structure

Notifications are stored in `data/notifications.json` with the following structure:

```json
{
  "id": "n1234567890",
  "tenantId": "t1",
  "userId": "u1",
  "type": "member_joined",
  "title": "New Member Joined",
  "body": "Someone new joined",
  "read": false,
  "createdAt": "2026-07-06T10:30:00.000Z"
}
```

## Auto-Generated Demo Events

The server automatically generates demo notifications every 30 seconds to simulate real-time activity. These events randomly alternate between:
- `member_joined` - A new member joined the community
- `creator_replied` - The creator replied to a comment

## Environment Variables

- **`PORT`**: Server port (default: `3000`)

**Example**:
```bash
PORT=5000 npm start
```

## Usage Example

### Using JavaScript/Fetch

```javascript
// Get notifications
const response = await fetch('http://localhost:3000/notifications', {
  headers: {
    'x-tenant-id': 'tenant-123',
    'x-user-id': 'user-456'
  }
});
const notifications = await response.json();

// Create a notification
const newNotif = await fetch('http://localhost:3000/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'tenant-123',
    'x-user-id': 'user-456'
  },
  body: JSON.stringify({
    tenantId: 'tenant-123',
    userId: 'user-456',
    type: 'custom_event',
    title: 'Hello',
    body: 'This is a notification'
  })
});

// Mark as read
await fetch('http://localhost:3000/notifications/n1234567890/read', {
  method: 'PATCH',
  headers: {
    'x-tenant-id': 'tenant-123',
    'x-user-id': 'user-456'
  }
});
```

## Notes

- Notifications are sorted by read status (unread first) and then by creation date (newest first)
- Broadcast notifications (where `userId: null`) are visible to all users in a tenant
- User-specific notifications are only visible to the specified user
- The data file is automatically created on first run if it doesn't exist

## License

MIT

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.
