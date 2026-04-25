import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getConversations,
  getMessages,
  getChatCustomers,
} from "../../api/chat";
import {
  getStaffConversations,
  openStaffConversation,
  getStaffMessages,
  getColleagues,
} from "../../api/staffChat";
import { startConnection } from "../../api/signalr";
import { MessageSquare, Send, Search, UserPlus, Users } from "lucide-react";

const ROLE_LABELS = { 1: "Admin", 2: "Manager", 3: "Pharmacist" };
const ROLE_COLORS = { 1: "#ef4444", 2: "#6366f1", 3: "#0d9488" };

// Handles both camelCase (SignalR default) and PascalCase (controller fallback) property names
function getSenderId(msg) {
  return (
    msg?.senderId ?? msg?.SenderId ?? msg?.senderID ?? msg?.SenderID ?? null
  );
}

function getConversationId(msg) {
  return (
    msg?.conversationId ??
    msg?.ConversationId ??
    msg?.conversationID ??
    msg?.ConversationID ??
    null
  );
}

function getMessageId(msg) {
  return msg?.id ?? msg?.Id ?? null;
}

function normalizeMessage(msg) {
  return {
    ...msg,
    id: getMessageId(msg),
    conversationId: getConversationId(msg),
    senderId: getSenderId(msg),
    senderName: msg?.senderName ?? msg?.SenderName ?? "",
    content: msg?.content ?? msg?.Content ?? "",
    sentAt: msg?.sentAt ?? msg?.SentAt ?? new Date().toISOString(),
    isRead: msg?.isRead ?? msg?.IsRead ?? false,
  };
}

// Tells DashboardLayout to subtract `delta` unread from its sidebar badge immediately.
// When delta is 0 (incoming message), DashboardLayout falls back to a server fetch.
function notifyBadgeDelta(delta) {
  window.dispatchEvent(new CustomEvent("novachat-read", { detail: { delta } }));
}

function Avatar({ name = "?", size = 38, role }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const bg = role ? ROLE_COLORS[role] || "var(--primary)" : "var(--primary)";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.34,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Customer Chats Panel ────────────────────────────────────────────────────
function CustomerChatsPanel({ currentUser, connectionRef }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showCustomers, setShowCustomers] = useState(false);
  const messagesEndRef = useRef(null);
  // Ref so SignalR handlers always see the current activeConvId without stale closures
  const activeConvIdRef = useRef(null);

  const loadConversations = useCallback(() => {
    getConversations()
      .then(setConversations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    getChatCustomers()
      .then(setCustomers)
      .catch(() => {});
  }, [loadConversations, currentUser]);

  // Keep ref in sync with state
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // SignalR listeners
  useEffect(() => {
    let mounted = true;
    let connRef = null;
    let receiveHandler = null;
    let newConvHandler = null;

    startConnection()
      .then((conn) => {
        if (!mounted) return;
        connRef = conn;

        receiveHandler = (rawMsg) => {
          if (!mounted) return;
          const msg = normalizeMessage(rawMsg);

          if (String(msg.conversationId) === String(activeConvIdRef.current)) {
            // Actively viewing this conversation — append message, no unread change
            // Also remove any optimistic message with same content from same sender
            setMessages((prev) => {
              const deduped = prev.filter(
                (m) =>
                  !(
                    m.optimistic &&
                    String(m.conversationId) === String(msg.conversationId) &&
                    String(getSenderId(m)) === String(getSenderId(msg)) &&
                    m.content === msg.content
                  ),
              );
              return deduped.some(
                (m) => String(getMessageId(m)) === String(getMessageId(msg)),
              )
                ? deduped
                : [...deduped, msg];
            });
          } else {
            // Not open — increment unread count and update preview for that conversation
            setConversations((prev) =>
              prev.map((c) =>
                String(c.id) === String(msg.conversationId)
                  ? {
                      ...c,
                      lastMessage: msg.content,
                      lastMessageAt: msg.sentAt,
                      // Only count messages not sent by the current user
                      unreadCount:
                        String(getSenderId(msg)) !== String(currentUser?.id)
                          ? (c.unreadCount || 0) + 1
                          : c.unreadCount,
                    }
                  : c,
              ),
            );
          }
        };

        newConvHandler = () => loadConversations();

        conn.off("ReceiveMessage", receiveHandler);
        conn.off("NewConversation", newConvHandler);
        conn.on("ReceiveMessage", receiveHandler);
        conn.on("NewConversation", newConvHandler);
      })
      .catch(() => {});
    return () => {
      mounted = false;
      if (connRef && receiveHandler)
        connRef.off("ReceiveMessage", receiveHandler);
      if (connRef && newConvHandler)
        connRef.off("NewConversation", newConvHandler);
    };
  }, [loadConversations, currentUser]);

  // Open a conversation: zero its badge instantly and mark messages as read on the server
  const openConversation = useCallback(
    (conv) => {
      setActiveConvId(conv.id);
      const unread = conv.unreadCount || 0;
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      );
      // Instantly subtract from the sidebar badge — no server round-trip needed
      if (unread > 0) {
        notifyBadgeDelta(unread);
        // Also tell the server to mark those messages as read
        const conn = connectionRef.current;
        if (conn) conn.invoke("MarkRead", conv.id).catch(() => {});
      }
    },
    [connectionRef],
  );

  useEffect(() => {
    if (activeConvId)
      getMessages(activeConvId)
        .then((data) => setMessages((data || []).map(normalizeMessage)))
        .catch(() => {});
    else setMessages([]);
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeConvId || sending) return;
    const conn = connectionRef.current;
    if (!conn) return;

    // Optimistic UI — show message immediately like WhatsApp
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      conversationId: activeConvId,
      senderId: currentUser?.id,
      senderName: `${currentUser?.firstName} ${currentUser?.lastName}`,
      content: text,
      sentAt: new Date().toISOString(),
      isRead: true,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setSending(true);

    try {
      await conn.invoke("SendMessage", activeConvId, text);
      // Server echoes back via ReceiveMessage with real id
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const handleInitiateChat = async (customer) => {
    setShowCustomers(false);
    const conn = connectionRef.current;
    if (!conn) return;
    try {
      await conn.invoke("StartConversation", customer.id, currentUser.role);
      setTimeout(loadConversations, 500);
    } catch {
      /* silent */
    }
  };

  const filtered = conversations.filter(
    (c) =>
      !search || c.customerName?.toLowerCase().includes(search.toLowerCase()),
  );
  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 20,
          height: 580,
        }}
      >
        {/* Conversation list */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="form-input"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 30, height: 34, fontSize: "0.83rem" }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCustomers(true)}
              style={{
                padding: "6px 10px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8rem",
              }}
            >
              <UserPlus size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <MessageSquare
                  size={28}
                  style={{ opacity: 0.3, marginBottom: 8 }}
                />
                <p style={{ fontSize: "0.83rem", margin: 0 }}>
                  No customer conversations
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: "1px solid var(--border-color)",
                    background:
                      activeConvId === conv.id
                        ? "var(--primary-50, #f0fdfa)"
                        : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Avatar name={conv.customerName} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: "0.87rem" }}>
                          {conv.customerName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                          }}
                        >
                          {conv.lastMessage || "No messages yet"}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              minWidth: 18,
                              height: 18,
                              borderRadius: 999,
                              background: "var(--primary)",
                              color: "white",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 4px",
                              flexShrink: 0,
                            }}
                          >
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message panel */}
        {activeConvId ? (
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Avatar name={activeConv?.customerName} size={38} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {activeConv?.customerName}
                </div>
                <div
                  style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                >
                  {activeConv?.customerEmail}
                </div>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: 32,
                  }}
                >
                  <MessageSquare
                    size={32}
                    style={{ opacity: 0.3, marginBottom: 10 }}
                  />
                  <p style={{ fontSize: "0.875rem" }}>
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe =
                  String(getSenderId(msg)) === String(currentUser?.id);
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px 14px",
                        borderRadius: isMe
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isMe
                          ? "var(--primary)"
                          : "var(--bg-base, #f1f5f9)",
                        color: isMe ? "white" : "var(--text-primary)",
                      }}
                    >
                      {!isMe && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            marginBottom: 4,
                            opacity: 0.7,
                          }}
                        >
                          {msg.senderName}
                        </div>
                      )}
                      <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                        {msg.content}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          marginTop: 4,
                          opacity: 0.7,
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSend}
              style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: 10,
              }}
            >
              <input
                className="form-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!input.trim() || sending}
                style={{ padding: "10px 16px", flexShrink: 0 }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <MessageSquare
                size={48}
                style={{ opacity: 0.2, marginBottom: 16 }}
              />
              <p style={{ fontWeight: 500 }}>Select a conversation</p>
              <p style={{ fontSize: "0.875rem", marginTop: 4 }}>
                Choose a conversation from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Customer picker modal */}
      {showCustomers && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "28px 28px 24px",
              width: 460,
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          >
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Start Conversation
            </h3>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: "0.83rem",
                color: "#64748b",
              }}
            >
              Select a customer to begin chatting
            </p>

            {customers.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>
                No registered customers yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleInitiateChat(c)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f0fdf9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "background 0.15s",
                    }}
                  >
                    <Avatar name={`${c.firstName} ${c.lastName}`} size={42} />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#0f172a",
                        }}
                      >
                        {c.firstName} {c.lastName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          marginTop: 2,
                        }}
                      >
                        {c.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCustomers(false)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "11px",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                background: "#f1f5f9",
                color: "#374151",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Team Chat Panel ─────────────────────────────────────────────────────────
function TeamChatPanel({ currentUser, connectionRef }) {
  const [conversations, setConversations] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeOther, setActiveOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [showColleagues, setShowColleagues] = useState(false);
  const messagesEndRef = useRef(null);
  // Ref so SignalR handler sees current activeConvId without stale closures
  const activeConvIdRef = useRef(null);

  const loadConversations = useCallback(() => {
    getStaffConversations()
      .then(setConversations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    getColleagues()
      .then(setColleagues)
      .catch(() => {});
  }, [loadConversations]);

  // Keep ref in sync with state
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // SignalR listener for staff messages
  useEffect(() => {
    let mounted = true;
    let connRef = null;
    let receiveHandler = null;

    startConnection()
      .then((conn) => {
        if (!mounted) return;
        connRef = conn;

        receiveHandler = (rawMsg) => {
          if (!mounted) return;
          const msg = normalizeMessage(rawMsg);

          if (String(msg.conversationId) === String(activeConvIdRef.current)) {
            // Actively viewing — append, no unread change
            // Also remove any optimistic message with same content from same sender
            setMessages((prev) => {
              const deduped = prev.filter(
                (m) =>
                  !(
                    m.optimistic &&
                    String(m.conversationId) === String(msg.conversationId) &&
                    String(getSenderId(m)) === String(getSenderId(msg)) &&
                    m.content === msg.content
                  ),
              );
              return deduped.some(
                (m) => String(getMessageId(m)) === String(getMessageId(msg)),
              )
                ? deduped
                : [...deduped, msg];
            });
          } else {
            // Not open — increment unread and update preview
            setConversations((prev) => {
              const exists = prev.some(
                (c) => String(c.id) === String(msg.conversationId),
              );
              if (exists) {
                return prev.map((c) =>
                  String(c.id) === String(msg.conversationId)
                    ? {
                        ...c,
                        lastMessage: msg.content,
                        lastMessageAt: msg.sentAt,
                        unreadCount:
                          String(getSenderId(msg)) !== String(currentUser?.id)
                            ? (c.unreadCount || 0) + 1
                            : c.unreadCount,
                      }
                    : c,
                );
              }
              // New conversation appeared — fetch to get full details
              getStaffConversations()
                .then(setConversations)
                .catch(() => {});
              return prev;
            });
          }
        };

        conn.off("ReceiveStaffMessage", receiveHandler);
        conn.on("ReceiveStaffMessage", receiveHandler);
      })
      .catch(() => {});
    return () => {
      mounted = false;
      if (connRef && receiveHandler)
        connRef.off("ReceiveStaffMessage", receiveHandler);
    };
  }, [loadConversations, currentUser]);

  useEffect(() => {
    if (activeConvId) {
      getStaffMessages(activeConvId)
        .then((data) => setMessages((data || []).map(normalizeMessage)))
        .catch(() => {});
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Open a conversation: zero its badge instantly (server auto-marks read via getStaffMessages)
  const openConversation = useCallback((conv) => {
    const unread = conv.unreadCount || 0;
    setActiveConvId(conv.id);
    setActiveOther({ name: conv.otherName, role: conv.otherRole });
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
    );
    if (unread > 0) notifyBadgeDelta(unread);
  }, []);

  const handleOpenConversation = async (colleague) => {
    setShowColleagues(false);
    try {
      const data = await openStaffConversation(colleague.id);
      const conv = {
        id: data.id,
        otherName: `${colleague.firstName} ${colleague.lastName}`,
        otherRole: colleague.role,
        unreadCount: 0,
      };
      setActiveConvId(data.id);
      setActiveOther({ name: conv.otherName, role: conv.otherRole });
      loadConversations();
    } catch {
      /* silent */
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeConvId || sending) return;
    const conn = connectionRef.current;
    if (!conn) return;

    // Optimistic UI — show message immediately like WhatsApp
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      conversationId: activeConvId,
      senderId: currentUser?.id,
      senderName: `${currentUser?.firstName} ${currentUser?.lastName}`,
      content: text,
      sentAt: new Date().toISOString(),
      isRead: true,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setSending(true);

    try {
      await conn.invoke("SendStaffMessage", activeConvId, text);
      // Server echoes back via ReceiveStaffMessage with real id
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter(
    (c) => !search || c.otherName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 20,
          height: 580,
        }}
      >
        {/* Conversation list */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="form-input"
                placeholder="Search colleagues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 30, height: 34, fontSize: "0.83rem" }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowColleagues(true)}
              style={{
                padding: "6px 10px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8rem",
              }}
            >
              <UserPlus size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Users size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: "0.83rem", margin: 0 }}>
                  No team conversations yet
                </p>
                <p style={{ fontSize: "0.78rem", marginTop: 4, opacity: 0.7 }}>
                  Click + to message a colleague
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: "1px solid var(--border-color)",
                    background:
                      activeConvId === conv.id
                        ? "var(--primary-50, #f0fdfa)"
                        : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Avatar
                      name={conv.otherName}
                      size={36}
                      role={conv.otherRole}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: "0.87rem" }}>
                          {conv.otherName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 2,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 999,
                              background: `${ROLE_COLORS[conv.otherRole]}18`,
                              color: ROLE_COLORS[conv.otherRole],
                            }}
                          >
                            {ROLE_LABELS[conv.otherRole]}
                          </span>
                          <span
                            style={{
                              fontSize: "0.76rem",
                              color: "var(--text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 100,
                            }}
                          >
                            {conv.lastMessage || "No messages yet"}
                          </span>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              minWidth: 18,
                              height: 18,
                              borderRadius: 999,
                              background: "var(--primary)",
                              color: "white",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 4px",
                              flexShrink: 0,
                            }}
                          >
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message panel */}
        {activeConvId ? (
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Avatar
                name={activeOther?.name}
                size={38}
                role={activeOther?.role}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {activeOther?.name}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: `${ROLE_COLORS[activeOther?.role]}18`,
                    color: ROLE_COLORS[activeOther?.role],
                  }}
                >
                  {ROLE_LABELS[activeOther?.role]}
                </span>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: 32,
                  }}
                >
                  <MessageSquare
                    size={32}
                    style={{ opacity: 0.3, marginBottom: 10 }}
                  />
                  <p style={{ fontSize: "0.875rem" }}>
                    Say hello to your colleague!
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe =
                  String(getSenderId(msg)) === String(currentUser?.id);
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px 14px",
                        borderRadius: isMe
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isMe
                          ? "var(--primary)"
                          : "var(--bg-base, #f1f5f9)",
                        color: isMe ? "white" : "var(--text-primary)",
                      }}
                    >
                      {!isMe && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            marginBottom: 4,
                            opacity: 0.7,
                          }}
                        >
                          {msg.senderName}
                        </div>
                      )}
                      <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                        {msg.content}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          marginTop: 4,
                          opacity: 0.7,
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSend}
              style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: 10,
              }}
            >
              <input
                className="form-input"
                placeholder="Message your colleague..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!input.trim() || sending}
                style={{ padding: "10px 16px", flexShrink: 0 }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p style={{ fontWeight: 500 }}>Team Chat</p>
              <p style={{ fontSize: "0.875rem", marginTop: 4 }}>
                Select a colleague or click + to start a new chat
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Colleague picker modal */}
      {showColleagues && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "28px 28px 24px",
              width: 460,
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          >
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Message a Colleague
            </h3>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: "0.83rem",
                color: "#64748b",
              }}
            >
              Select a staff member to start a private chat
            </p>
            {colleagues.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>
                No other staff members found.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {colleagues.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenConversation(c)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f0fdf9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "background 0.15s",
                    }}
                  >
                    <Avatar
                      name={`${c.firstName} ${c.lastName}`}
                      size={42}
                      role={c.role}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#0f172a",
                        }}
                      >
                        {c.firstName} {c.lastName}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: `${ROLE_COLORS[c.role]}18`,
                            color: ROLE_COLORS[c.role],
                          }}
                        >
                          {ROLE_LABELS[c.role]}
                        </span>
                        {c.branch && (
                          <span
                            style={{ fontSize: "0.75rem", color: "#64748b" }}
                          >
                            {c.branch}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowColleagues(false)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "11px",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                background: "#f1f5f9",
                color: "#374151",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Chats page ─────────────────────────────────────────────────────────
export default function Chats() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("customers");
  const connectionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    startConnection()
      .then((conn) => {
        if (!mounted) return;
        connectionRef.current = conn;
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const tabs = [
    { key: "customers", label: "Customer Chats", icon: MessageSquare },
    { key: "team", label: "Team Chat", icon: Users },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Chats</h1>
          <p className="page-header-subtitle">
            Customer conversations and internal team messaging
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--border-color)",
          marginBottom: 24,
        }}
      >
        {tabs.map(({ key, label, icon }) => {
          const TabIcon = icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                color:
                  activeTab === key ? "var(--primary)" : "var(--text-muted)",
                borderBottom:
                  activeTab === key
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                marginBottom: -2,
                transition: "all 0.15s",
              }}
            >
              <TabIcon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "customers" ? (
        <CustomerChatsPanel
          currentUser={currentUser}
          connectionRef={connectionRef}
        />
      ) : (
        <TeamChatPanel
          currentUser={currentUser}
          connectionRef={connectionRef}
        />
      )}
    </div>
  );
}
