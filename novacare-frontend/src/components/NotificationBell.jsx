import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../api/dashboard';
import { Bell, ClipboardList, Package, AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';

const POLL_MS = 60_000; // refresh every minute
const READ_KEY = 'novacare_notifications_read';

const iconFor = (type) => {
  switch (type) {
    case 'pending_order':  return ClipboardList;
    case 'low_stock':      return Package;
    case 'expiring':       return AlertTriangle;
    case 'unread_message': return MessageSquare;
    default:               return Bell;
  }
};

const colorFor = (severity) => {
  switch (severity) {
    case 'danger':  return 'var(--danger)';
    case 'warning': return 'var(--warning)';
    default:        return 'var(--primary)';
  }
};

const loadReadIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []); }
  catch { return new Set(); }
};

const saveReadIds = (set) => {
  localStorage.setItem(READ_KEY, JSON.stringify([...set]));
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => loadReadIds());
  const wrapperRef = useRef(null);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => { /* silent — don't break the topbar if it fails */ })
      .finally(() => setLoading(false));
  };

  // Initial fetch + polling. Schedule the first call via microtask so we
  // don't trigger setState synchronously inside the effect body.
  useEffect(() => {
    queueMicrotask(load);
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const unreadCount = items.filter((n) => !readIds.has(n.id)).length;

  const handleClick = (n) => {
    const next = new Set(readIds);
    next.add(n.id);
    setReadIds(next);
    saveReadIds(next);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAllRead = () => {
    const next = new Set([...readIds, ...items.map((n) => n.id)]);
    setReadIds(next);
    saveReadIds(next);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        className="topbar-btn"
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-dot" />}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              background: 'var(--danger)',
              color: 'white',
              borderRadius: 999,
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-card, #fff)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 380,
            maxHeight: 480,
            background: 'var(--bg-card, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <strong style={{ fontSize: '0.95rem' }}>Notifications</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {items.length > 0 && unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', padding: 0 }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={load}
                title="Refresh"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
              >
                <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
              </button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{loading ? 'Loading…' : "You're all caught up!"}</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = iconFor(n.type);
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      background: isRead ? 'transparent' : 'var(--primary-50, #f0fdfa)',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 12,
                      textAlign: 'left',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: colorFor(n.severity),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: isRead ? 500 : 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {n.description}
                      </div>
                      {n.timestamp && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {timeAgo(n.timestamp)}
                        </div>
                      )}
                    </div>
                    {!isRead && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
