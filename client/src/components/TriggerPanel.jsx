import React, { useState, useEffect } from 'react';
import { fireTrigger } from '../api/notifications';

/**
 * TriggerPanel — Minimal demo panel to fire simulated events.
 */
export default function TriggerPanel({ tenantId, userId, onTriggered }) {
  const [firingInvite, setFiringInvite] = useState(false);
  const [firingReply, setFiringReply] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);

  useEffect(() => {
    if (lastStatus) {
      const timer = setTimeout(() => setLastStatus(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastStatus]);

  const handleInvite = async () => {
    setFiringInvite(true);
    setLastStatus(null);
    try {
      const result = await fireTrigger(tenantId, userId, 'invite', {
        memberName: randomName(),
        orgName: 'Nova Talent',
      });
      setLastStatus(result.message);
      onTriggered?.();
    } catch (err) {
      setLastStatus(`Error: ${err.message}`);
    } finally {
      setTimeout(() => setFiringInvite(false), 300);
    }
  };

  const handleReply = async () => {
    setFiringReply(true);
    setLastStatus(null);
    try {
      const result = await fireTrigger(tenantId, userId, 'reply', {
        creatorName: randomCreator(),
      });
      setLastStatus(result.message);
      onTriggered?.();
    } catch (err) {
      setLastStatus(`Error: ${err.message}`);
    } finally {
      setTimeout(() => setFiringReply(false), 300);
    }
  };

  return (
    <div className="trigger-panel" id="trigger-panel">
      <div className="trigger-panel-header">
        <h2>Send a Notification</h2>
        <span className="badge">Try It Out</span>
      </div>
      <div className="trigger-category">
        <h3>Choose an Event</h3>
      </div>
      <div className="trigger-grid">
        <button
          className={`trigger-card ${firingInvite ? 'firing' : ''}`}
          onClick={handleInvite}
          disabled={firingInvite}
          id="trigger-invite-btn"
          title="Click to send a team invite notification"
        >
          <div className="trigger-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="trigger-card-title">Invite a Team Member</div>
          <div className="trigger-card-desc">
            Everyone on the team will be notified about a new member joining.
          </div>
          <div className="trigger-card-footer">
            <span className="trigger-card-type">👥 Team-wide</span>
            <span className="trigger-cta">{firingInvite ? 'Sending…' : '▶ Try This'}</span>
          </div>
        </button>
        <button
          className={`trigger-card ${firingReply ? 'firing' : ''}`}
          onClick={handleReply}
          disabled={firingReply}
          id="trigger-reply-btn"
          title="Click to send a reply notification"
        >
          <div className="trigger-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="trigger-card-title">Get a Reply</div>
          <div className="trigger-card-desc">
            You'll be notified when someone replies to your message.
          </div>
          <div className="trigger-card-footer">
            <span className="trigger-card-type">🔒 Only You</span>
            <span className="trigger-cta">{firingReply ? 'Sending…' : '▶ Try This'}</span>
          </div>
        </button>
      </div>
      {lastStatus && (
        <div className="trigger-status" id="trigger-status">
          {lastStatus}
        </div>
      )}
    </div>
  );
}

const NAMES = ['Alex Chen', 'Jordan Lee', 'Sam Rivera', 'Taylor Kim', 'Morgan Patel', 'Casey Quinn'];
const CREATORS = ['Marcus Johnson', 'Aria Patel', 'Liam Foster', 'Emma Torres', 'Noah Williams', 'Sophia Chen'];
function randomName() { return NAMES[Math.floor(Math.random() * NAMES.length)]; }
function randomCreator() { return CREATORS[Math.floor(Math.random() * CREATORS.length)]; }
