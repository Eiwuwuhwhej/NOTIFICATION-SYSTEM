import React from 'react';

export default function WriteupPage() {
  return (
    <main className="main-content writeup-page">
      <section className="hero-section">
        <h2 className="hero-title">Integration & Future Improvements</h2>
        <p className="hero-subtitle">
          How this notification system fits into a larger AI-native CRM architecture.
        </p>
      </section>

      <div className="writeup-content">
        <div className="writeup-card">
          <h3>Part 1: Integration (Fitting into a Larger System)</h3>
          <p className="writeup-desc">
            Transitioning from a standalone full-stack app into a decoupled microservice.
          </p>
          
          <div className="writeup-point">
            <h4>1. Authentication & Identity</h4>
            <p><strong>What changes:</strong> The system currently trusts the <code>X-Tenant-Id</code> and <code>X-User-Id</code> headers implicitly. In a real system, we would place this notification service behind the company's existing API Gateway. The Gateway would validate the user's JWT, securely extract the <code>tenantId</code> and <code>userId</code>, and inject them into the headers before forwarding the request. The internal notification code remains entirely unchanged.</p>
          </div>

          <div className="writeup-point">
            <h4>2. Event Triggers (Decoupling)</h4>
            <p><strong>What changes:</strong> We would introduce an asynchronous Message Broker (like RabbitMQ, Kafka, or AWS EventBridge). When an event occurs (e.g., a creator replies), the Messaging Service publishes a <code>CreatorReplied</code> event to the broker. Our Notification Service runs a background worker that subscribes to this topic, transforms the event into our standard Notification model, and saves it to the database. This ensures the core CRM doesn't crash if the notification database goes down.</p>
          </div>

          <div className="writeup-point">
            <h4>3. Database Architecture</h4>
            <p><strong>What stays:</strong> We would keep the notifications in their own isolated table (or entirely separate database) to prevent notification queries from competing for resources with core CRM data. The strict composite indexing on <code>(tenantId, userId, read, createdAt)</code> would remain critical.</p>
          </div>
        </div>

        <div className="writeup-card">
          <h3>Part 2: What we would do differently with more time</h3>
          <p className="writeup-desc">
            Technical and UX enhancements for a larger scale deployment.
          </p>

          <div className="writeup-point">
            <h4>1. WebSockets / Server-Sent Events (SSE)</h4>
            <p>Currently, the React client polls the server every 15 seconds. While functional, this wastes bandwidth when the system is idle. We would upgrade this to WebSockets (or SSE) to push events to the client instantly.</p>
          </div>

          <div className="writeup-point">
            <h4>2. Cursor-Based Pagination</h4>
            <p>The <code>GET /notifications</code> endpoint currently uses offset/limit pagination. For a system with thousands of historical notifications per user, this gets slow. We would refactor the query to use cursor-based pagination (e.g., <code>WHERE createdAt &lt; last_seen_date</code>) for consistent performance.</p>
          </div>

          <div className="writeup-point">
            <h4>3. Notification Grouping / Rollups</h4>
            <p>If a user goes on vacation and 10 people reply to a campaign, the UI will show 10 separate rows. We would add a grouping engine to aggregate these into a single notification: <em>"Sarah and 9 others replied to your campaign"</em>, preventing notification fatigue.</p>
          </div>

          <div className="writeup-point">
            <h4>4. Delivery Preferences</h4>
            <p>We would introduce a <code>notification_preferences</code> table, allowing users to mute specific types (e.g., turn off "member_invited" alerts) or route them to different channels (Push, Email, Slack) instead of just in-app.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
