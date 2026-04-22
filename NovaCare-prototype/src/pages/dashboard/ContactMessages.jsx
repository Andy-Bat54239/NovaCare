import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { contactMessages } from '../../data/contactMessages';
import { branches } from '../../data/branches';
import { Mail, MailOpen, Reply, Trash2, Send, X } from 'lucide-react';

export default function ContactMessages() {
  const { hasPermission } = useAuth();
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [expandedId, setExpandedId] = useState(null);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState(contactMessages);

  const unreadCount = messages.filter(m => !m.isRead).length;
  const filtered = filter === 'All' ? messages : filter === 'Unread' ? messages.filter(m => !m.isRead) : messages.filter(m => m.isRead);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleRead = (id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !m.isRead } : m));
  const deleteMsg = (id) => setMessages(prev => prev.filter(m => m.id !== id));
  const sendReply = () => { console.log('Reply to', replyId, ':', replyText); setMessages(prev => prev.map(m => m.id === replyId ? { ...m, isRead: true, repliedAt: new Date().toISOString() } : m)); setReplyId(null); setReplyText(''); alert('Reply sent!'); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Contact Messages <span className="badge badge-danger" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>{unreadCount}</span></h1></div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        {['All', 'Unread', 'Read'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => { setFilter(f); setPage(1); }}>{f}</button>
        ))}
      </div>

      {paginated.map(msg => {
        const branch = branches.find(b => b.id === msg.branchId);
        const isExpanded = expandedId === msg.id;
        return (
          <div key={msg.id} className={`message-card ${!msg.isRead ? 'unread' : ''}`} onClick={() => setExpandedId(isExpanded ? null : msg.id)}>
            <div className="message-card-header">
              <div>
                <div className="message-card-sender">{msg.isRead ? <MailOpen size={16} style={{ marginRight: 6 }} /> : <Mail size={16} style={{ marginRight: 6 }} />}{msg.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{msg.email} {branch ? `— ${branch.name}` : ''}</div>
              </div>
              <div className="message-card-date">{new Date(msg.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="message-card-subject">{msg.subject}</div>
            {!isExpanded && <div className="message-card-preview">{msg.message}</div>}

            {isExpanded && (
              <div className="message-card-expanded" onClick={e => e.stopPropagation()}>
                <div className="message-card-full">{msg.message}</div>
                {msg.repliedAt && <div className="alert alert-success"><Reply size={14} /> Replied on {new Date(msg.repliedAt).toLocaleDateString()}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  {hasPermission('ReplyContactMessages') && <button className="btn btn-sm btn-primary" onClick={() => { setReplyId(msg.id); setReplyText(''); }}><Reply size={14} /> Reply</button>}
                  <button className="btn btn-sm btn-secondary" onClick={() => toggleRead(msg.id)}>{msg.isRead ? 'Mark Unread' : 'Mark Read'}</button>
                  {hasPermission('ReplyContactMessages') && <button className="btn btn-sm btn-danger" onClick={() => deleteMsg(msg.id)}><Trash2 size={14} /></button>}
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
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      {replyId && (
        <div className="modal-overlay" onClick={() => setReplyId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Reply to Message</h2><button className="modal-close" onClick={() => setReplyId(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Your Reply</label>
                <textarea className="form-textarea" rows={5} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReplyId(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={!replyText.trim()} onClick={sendReply}><Send size={18} /> Send Reply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
