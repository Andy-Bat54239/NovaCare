import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getConversations, createConversation, getMessages, getBranches } from '../../api/chat';
import { startConnection } from '../../api/signalr';
import { MessageSquare, Send, Plus, ChevronLeft } from 'lucide-react';

const ROLE_LABELS = { 2: 'Manager', 3: 'Pharmacist' };
const ROLE_COLORS = { 2: '#6366f1', 3: '#0d9488' };

export default function CustomerChat() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [startError, setStartError] = useState('');
  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);
  // Ref so SignalR handler always sees the current activeConvId
  const activeConvIdRef = useRef(null);

  const loadConversations = useCallback(() => {
    getConversations().then(setConversations).catch(() => {});
  }, []);

  const loadMessages = useCallback((convId) => {
    if (!convId) return;
    getMessages(convId).then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    setLoading(false);
    getBranches().then(data => {
      setBranches(data || []);
      if (data?.length === 1) setSelectedBranchId(data[0].id);
    }).catch(() => {});
  }, [loadConversations]);

  // Keep ref in sync with state
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // SignalR setup
  useEffect(() => {
    let mounted = true;
    startConnection().then(conn => {
      if (!mounted) return;
      connectionRef.current = conn;

      conn.on('ReceiveMessage', (msg) => {
        if (!mounted) return;

        if (msg.conversationId === activeConvIdRef.current) {
          // Currently viewing — append immediately, no unread change
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        } else {
          // Not open — increment unread count and update preview
          setConversations(prev => prev.map(c =>
            c.id === msg.conversationId
              ? {
                  ...c,
                  lastMessage: msg.content,
                  lastMessageAt: msg.sentAt,
                  unreadCount: msg.senderId !== currentUser?.id
                    ? (c.unreadCount || 0) + 1
                    : c.unreadCount,
                }
              : c
          ));
          // Notify CustomerLayout nav badge (incoming message — re-fetch from server)
          window.dispatchEvent(new CustomEvent('novachat-read', { detail: { delta: 0 } }));
        }
      });

      conn.on('NewConversation', loadConversations);
    }).catch(() => {});

    return () => { mounted = false; };
  }, [loadConversations, currentUser]);

  // Open a conversation: zero its badge instantly, mark messages read on the server
  const openConversation = useCallback((conv) => {
    const convId = typeof conv === 'object' ? conv.id : conv;
    const unread = typeof conv === 'object' ? (conv.unreadCount || 0) : 0;
    setActiveConvId(convId);
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, unreadCount: 0 } : c
    ));
    if (unread > 0) {
      // Instantly subtract from CustomerLayout nav badge
      window.dispatchEvent(new CustomEvent('novachat-read', { detail: { delta: unread } }));
      // Tell the server to mark those messages as read
      const conn = connectionRef.current;
      if (conn) conn.invoke('MarkRead', convId).catch(() => {});
    }
  }, [connectionRef]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId) loadMessages(activeConvId);
    else setMessages([]);
  }, [activeConvId, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId || sending) return;
    const conn = connectionRef.current;
    if (!conn) return;
    setSending(true);
    try {
      await conn.invoke('SendMessage', activeConvId, input.trim());
      setInput('');
    } catch {
      // failed silently
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (targetRole) => {
    if (!selectedBranchId) {
      setStartError('Please select a branch first.');
      return;
    }
    setStartError('');
    setShowRoleModal(false);
    try {
      const conv = await createConversation(targetRole, selectedBranchId);
      loadConversations();
      openConversation(conv);
    } catch {
      setStartError('Could not start conversation. Please try again.');
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>Chat</h2>
        <p style={{ color: 'var(--text-muted)' }}>Chat with our pharmacy team in real time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeConvId ? '280px 1fr' : '1fr', gap: 20, height: 580 }}>
        {/* Conversation list */}
        <div style={{
          background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)',
          borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          ...(activeConvId ? {} : { maxWidth: 500 }),
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Conversations</span>
            <button onClick={() => setShowRoleModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
              <Plus size={14} /> New
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ fontSize: '0.875rem', margin: 0 }}>No conversations yet.<br />Click New to start one.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.id} onClick={() => openConversation(conv)}
                  style={{
                    width: '100%', padding: '14px 20px', border: 'none', borderBottom: '1px solid var(--border-color)',
                    background: activeConvId === conv.id ? 'var(--primary-50, #f0fdfa)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: `${ROLE_COLORS[conv.targetRole]}15`, color: ROLE_COLORS[conv.targetRole] }}>
                          {ROLE_LABELS[conv.targetRole] || 'Staff'}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message panel */}
        {activeConvId && (
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setActiveConvId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <ChevronLeft size={20} />
              </button>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {ROLE_LABELS[activeConv?.targetRole] || 'Staff'} Team
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NovaCare Pharmacy</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, idx) => {
                // isFromCustomer is set by the server — true when the customer sent it
                const isMe = msg.isFromCustomer === true;
                return (
                  <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'var(--primary)' : 'var(--bg-base, #f1f5f9)',
                      color: isMe ? 'white' : 'var(--text-primary)',
                    }}>
                      {!isMe && <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>{msg.senderName}</div>}
                      <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.content}</div>
                      <div style={{ fontSize: '0.7rem', marginTop: 4, opacity: 0.7, textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
              <input
                className="form-input"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={!input.trim() || sending} style={{ padding: '10px 16px', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Role + branch selector modal */}
      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: '28px 28px 24px', width: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Start a Conversation</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.83rem', color: '#64748b' }}>Choose a branch and the team you'd like to reach</p>

            {/* Branch selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Branch</label>
              {branches.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading branches...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {branches.map(b => (
                    <button key={b.id} onClick={() => setSelectedBranchId(b.id)}
                      style={{
                        padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                        border: `2px solid ${selectedBranchId === b.id ? 'var(--primary)' : '#e2e8f0'}`,
                        background: selectedBranchId === b.id ? 'var(--primary-50, #f0fdfa)' : '#f8fafc',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{b.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{b.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chat with</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <button key={role} onClick={() => handleStartConversation(Number(role))}
                    disabled={!selectedBranchId}
                    style={{
                      padding: '12px 16px', borderRadius: 10, border: `2px solid ${ROLE_COLORS[role]}25`,
                      background: selectedBranchId ? `${ROLE_COLORS[role]}08` : '#f1f5f9',
                      cursor: selectedBranchId ? 'pointer' : 'not-allowed',
                      textAlign: 'left', fontWeight: 600,
                      color: selectedBranchId ? ROLE_COLORS[role] : '#94a3b8',
                      fontSize: '0.92rem', opacity: selectedBranchId ? 1 : 0.6,
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { if (selectedBranchId) { e.currentTarget.style.borderColor = ROLE_COLORS[role]; e.currentTarget.style.background = `${ROLE_COLORS[role]}15`; }}}
                    onMouseOut={e => { e.currentTarget.style.borderColor = `${ROLE_COLORS[role]}25`; e.currentTarget.style.background = selectedBranchId ? `${ROLE_COLORS[role]}08` : '#f1f5f9'; }}>
                    Chat with {label}
                  </button>
                ))}
              </div>
            </div>

            {startError && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '-8px 0 12px' }}>{startError}</p>}

            <button onClick={() => { setShowRoleModal(false); setStartError(''); }}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f1f5f9', color: '#374151', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
