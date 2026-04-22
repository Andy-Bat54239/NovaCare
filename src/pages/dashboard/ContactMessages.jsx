import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMessages, replyMessage, markRead, deleteMessage } from '../../api/contactMessages';
import { Mail, MailOpen, Reply, Trash2, Send, X, RefreshCw } from 'lucide-react';

export default function ContactMessages() {
  const { hasPermission } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [expandedId, setExpandedId] = useState(null);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unreadCount = messages.filter(m => m.status === 'Unread').length;
  const filtered = filter === 'All'
    ? messages
    : filter === 'Unread'
    ? messages.filter(m => m.status === 'Unread')
    : messages.filter(m => m.status !== 'Unread');

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const notifyMailBadge = () => window.dispatchEvent(new Event('novamail-read'));

  const handleExpand = async (msg) => {
    const closing = expandedId === msg.id;
    setExpandedId(closing ? null : msg.id);
    // Auto-mark as read when opening an unread message
    if (!closing && msg.status === 'Unread') {
      try {
        await markRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'Read' } : m));
        notifyMailBadge();
      } catch {
        // silently ignore — badge will self-correct on next poll
      }
    }
  };

  const handleMarkRead = async (msg) => {
    try {
      await markRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: m.status === 'Unread' ? 'Read' : 'Unread' } : m));
      notifyMailBadge();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    const wasUnread = messages.find(m => m.id === id)?.status === 'Unread';
    try {
      await deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (wasUnread) notifyMailBadge();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    const wasUnread = messages.find(m => m.id === replyId)?.status === 'Unread';
    try {
      await replyMessage(replyId, replyText);
      setMessages(prev => prev.map(m => m.id === replyId ? { ...m, status: 'Replied', reply: replyText } : m));
      if (wasUnread) notifyMailBadge();
      setReplyId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading messages...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            Contact Messages{' '}
            {unreadCount > 0 && <span className="badge badge-danger" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>{unreadCount}</span>}
          </h1>
          <p className="page-header-subtitle">{messages.length} total messages</p>
        </div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        {['All', 'Unread', 'Read'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => { setFilter(f); setPage(1); }}>{f}</button>
        ))}
      </div>

      {paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          No messages found.
        </div>
      ) : paginated.map(msg => {
        const isExpanded = expandedId === msg.id;
        const isUnread = msg.status === 'Unread';
        return (
          <div key={msg.id} className={`message-card ${isUnread ? 'unread' : ''}`} onClick={() => handleExpand(msg)}>
            <div className="message-card-header">
              <div>
                <div className="message-card-sender">
                  {isUnread ? <Mail size={16} style={{ marginRight: 6 }} /> : <MailOpen size={16} style={{ marginRight: 6 }} />}
                  {msg.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {msg.email}{msg.branch ? ` — ${msg.branch.name}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${msg.status === 'Unread' ? 'badge-warning' : msg.status === 'Replied' ? 'badge-success' : 'badge-gray'}`}>
                  {msg.status}
                </span>
                <div className="message-card-date">{new Date(msg.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="message-card-subject">{msg.subject}</div>
            {!isExpanded && <div className="message-card-preview">{msg.message}</div>}

            {isExpanded && (
              <div className="message-card-expanded" onClick={e => e.stopPropagation()}>
                <div className="message-card-full">{msg.message}</div>
                {msg.replyText && (
                  <div className="alert alert-success" style={{ marginTop: 12 }}>
                    <Reply size={14} /> <strong>Reply sent:</strong> {msg.replyText}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {hasPermission('ReplyContactMessages') && (
                    <button className="btn btn-sm btn-primary" onClick={() => { setReplyId(msg.id); setReplyText(''); }}>
                      <Reply size={14} /> Reply
                    </button>
                  )}
                  <button className="btn btn-sm btn-secondary" onClick={() => handleMarkRead(msg)}>
                    {isUnread ? 'Mark Read' : 'Mark Unread'}
                  </button>
                  {hasPermission('ReplyContactMessages') && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(msg.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}

      {replyId && (
        <div className="modal-overlay" onClick={() => setReplyId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reply to Message</h2>
              <button className="modal-close" onClick={() => setReplyId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Your Reply</label>
                <textarea className="form-textarea" rows={5} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReplyId(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={!replyText.trim() || sending} onClick={sendReply}>
                <Send size={18} /> {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
