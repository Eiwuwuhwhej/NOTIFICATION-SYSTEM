import React, { useState, useCallback } from 'react';
import { useNotifications } from './hooks/useNotifications';
import NotificationBell from './components/NotificationBell';
import NotificationPanel from './components/NotificationPanel';
import TriggerPanel from './components/TriggerPanel';
import WriteupPage from './components/WriteupPage';

const IDENTITY_PRESETS = [
  { label: 'Marketing · Sarah', tenantId: 't1', userId: 'u1' },
  { label: 'Marketing · Mike', tenantId: 't1', userId: 'u2' },
  { label: 'Engineering · Sarah', tenantId: 't2', userId: 'u1' },
  { label: 'Engineering · Mike', tenantId: 't2', userId: 'u2' },
];

export default function App() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('demo');
  const [hasTriggeredOnce, setHasTriggeredOnce] = useState(false);
  const [bellAttention, setBellAttention] = useState(false);

  const { tenantId, userId } = IDENTITY_PRESETS[presetIndex];

  const {
    notifications,
    unreadCount,
    loading,
    countChanged,
    markRead,
    markAllRead,
    refresh,
  } = useNotifications(tenantId, userId);

  const togglePanel = useCallback(() => {
    setPanelOpen((prev) => {
      if (!prev) refresh();
      return !prev;
    });
  }, [refresh]);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  const handleTriggered = useCallback(() => {
    setHasTriggeredOnce(true);
    setBellAttention(true);
    setTimeout(refresh, 300);
    // Stop the attention animation after a few seconds
    setTimeout(() => setBellAttention(false), 3000);
  }, [refresh]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">N</div>
          <h1 className="topbar-title">NovaCRM</h1>
        </div>

        <nav className="main-nav">
          <button 
            className={`nav-btn ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            Demo
          </button>
          <button 
            className={`nav-btn ${activeTab === 'writeup' ? 'active' : ''}`}
            onClick={() => setActiveTab('writeup')}
          >
            Architecture Write-up
          </button>
        </nav>

        <div className="topbar-actions">
          <div className="identity-switcher">
            <span className="identity-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <select
              id="identity-switcher"
              value={presetIndex}
              onChange={(e) => {
                setPresetIndex(Number(e.target.value));
                setPanelOpen(false);
              }}
            >
              {IDENTITY_PRESETS.map((preset, i) => (
                <option key={i} value={i}>{preset.label}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <NotificationBell
              unreadCount={unreadCount}
              isOpen={panelOpen}
              onClick={togglePanel}
              countChanged={countChanged}
              bellAttention={bellAttention}
            />
            {panelOpen && (
              <NotificationPanel
                notifications={notifications}
                loading={loading}
                unreadCount={unreadCount}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onClose={closePanel}
              />
            )}
          </div>
        </div>
      </header>

      {activeTab === 'demo' ? (
        <main className="main-content">
          <section className="hero-section">
            <h2 className="hero-title">Notifications</h2>
            <p className="hero-subtitle">
              Send a test notification below and see it pop up in your bell.
            </p>
            <div className="instruction-box">
              <strong>✨ How it works</strong>
              <div className="steps-guide">
                <div className="step">
                  <span className="step-number">1</span>
                  <span className="step-icon">👇</span>
                  <span className="step-text">Click a card below to send a notification</span>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <span className="step-icon">🔔</span>
                  <span className="step-text">Check the bell icon in the top right</span>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <span className="step-icon">✅</span>
                  <span className="step-text">Click any notification to mark it as read</span>
                </div>
              </div>
            </div>
          </section>

        {!hasTriggeredOnce && (
          <div className="first-run-nudge">
            <span className="nudge-wave">👋</span>
            <div>
              <strong>Welcome!</strong> Click one of the cards below to send your first notification.
            </div>
            <span className="nudge-arrow">↓</span>
          </div>
        )}

        <section className="backend-flow-section">
          <h3>What happens behind the scenes?</h3>
          <div className="flowchart">
            <div className="flow-step">
              <div className="flow-icon">🖱️</div>
              <div className="flow-title">1. App</div>
              <div className="flow-desc">Sends API request</div>
            </div>
            <div className="flow-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
            <div className="flow-step">
              <div className="flow-icon">⚙️</div>
              <div className="flow-title">2. Server</div>
              <div className="flow-desc">Processes the event</div>
            </div>
            <div className="flow-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
            <div className="flow-step">
              <div className="flow-icon">🗄️</div>
              <div className="flow-title">3. Database</div>
              <div className="flow-desc">Saves notification</div>
            </div>
            <div className="flow-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
            <div className="flow-step">
              <div className="flow-icon">🔔</div>
              <div className="flow-title">4. App</div>
              <div className="flow-desc">Fetches new update</div>
            </div>
          </div>
          
          <ul className="flow-basics-list">
            <li><strong>Frontend to Backend:</strong> The React app triggers a Node.js server endpoint to securely register the event.</li>
            <li><strong>Optimized Storage:</strong> The server saves the notification in a localized Turso database with optimized query indices.</li>
            <li><strong>Real-time Polling:</strong> The app periodically checks for unread updates to display them instantly in your bell.</li>
          </ul>
        </section>

        <TriggerPanel
          tenantId={tenantId}
          userId={userId}
          onTriggered={handleTriggered}
        />



        <div className="footer-info">
          Notifications update automatically · Viewing as {IDENTITY_PRESETS[presetIndex].label}
        </div>
      </main>
      ) : (
        <WriteupPage />
      )}
    </>
  );
}
