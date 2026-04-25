import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Pill,
  Home,
  MessageSquare,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  User,
  ChevronDown,
} from "lucide-react";
import { getUnreadCount } from "../api/chat";
import { startConnection } from "../api/signalr";
import { useCart } from "../context/CartContext";

export default function CustomerLayout() {
  const { currentUser, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : "?";

  const fetchUnread = () => {
    getUnreadCount()
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    startConnection()
      .then((conn) => {
        conn.on("ReceiveMessage", () => fetchUnread());
        conn.on("NewConversation", () => fetchUnread());
      })
      .catch(() => {});

    // Subtract delta instantly when a conversation is opened; re-fetch for incoming messages
    const handleChatRead = (e) => {
      const delta = e.detail?.delta;
      if (delta > 0) {
        setUnreadCount((prev) => Math.max(0, prev - delta));
      } else {
        fetchUnread();
      }
    };

    const handleClickOutside = (e) => {
      if (
        profileDropdownOpen &&
        !e.target.closest("[data-customer-profile-dropdown]")
      ) {
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener("novachat-read", handleChatRead);
    document.addEventListener("click", handleClickOutside);

    return () => {
      clearInterval(interval);
      window.removeEventListener("novachat-read", handleChatRead);
      document.removeEventListener("click", handleClickOutside);
      // Do NOT stop the connection here — CustomerChat and other pages share it.
      // Connection is stopped on logout via AuthContext.
    };
  }, [profileDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/customer/profile");
    setProfileDropdownOpen(false);
    setMenuOpen(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base, #f1f5f9)" }}>
      {/* Top navbar */}
      <nav
        style={{
          background: "var(--card-bg, #fff)",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Pill size={18} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--text-primary)",
            }}
          >
            Nova<span style={{ color: "var(--primary)" }}>Care</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div
          style={{ display: "flex", gap: 4, alignItems: "center" }}
          className="customer-desktop-nav"
        >
          {[
            { to: "/customer", label: "Home", icon: Home, end: true },
            { to: "/customer/medicines", label: "Medicines", icon: Package },
            { to: "/customer/orders", label: "My Orders", icon: ClipboardList },
            {
              to: "/customer/chat",
              label: "Chat",
              icon: MessageSquare,
              badge: unreadCount,
            },
            {
              to: "/customer/checkout",
              label: "Cart",
              icon: ShoppingCart,
              badge: getItemCount(),
            },
          ].map(({ to, label, icon, end, badge }) => {
            const NavIcon = icon;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  position: "relative",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  background: isActive
                    ? "var(--primary-50, #f0fdfa)"
                    : "transparent",
                  transition: "all 0.15s",
                })}
              >
                <NavIcon size={16} />
                {label}
                {badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "var(--danger)",
                      color: "white",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }} data-customer-profile-dropdown>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProfileDropdownOpen((v) => !v);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
              }}
              title="Profile"
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                }}
              >
                {initials}
              </div>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
                className="customer-desktop-nav"
              >
                {currentUser?.firstName}
              </span>
              <ChevronDown
                size={16}
                color="var(--text-muted)"
                className="customer-desktop-nav"
              />
            </button>

            {profileDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 220,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.14)",
                  overflow: "hidden",
                  zIndex: 200,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {currentUser?.firstName} {currentUser?.lastName}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    {currentUser?.email}
                  </div>
                </div>

                <button
                  onClick={handleProfileClick}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "#ffffff",
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#111827",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderTop: "1px solid #e5e7eb",
                    background: "#ffffff",
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#dc2626",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          <button
            className="customer-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "none",
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "var(--card-bg)",
            borderBottom: "1px solid var(--border-color)",
            padding: "8px 16px",
          }}
        >
          {[
            { to: "/customer", label: "Home", end: true },
            { to: "/customer/medicines", label: "Medicines" },
            { to: "/customer/orders", label: "My Orders" },
            {
              to: "/customer/chat",
              label: `Chat${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            {
              to: "/customer/checkout",
              label: `Cart${getItemCount() > 0 ? ` (${getItemCount()})` : ""}`,
            },
            { to: "/customer/profile", label: "My Profile" },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: "block",
                padding: "10px 8px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.95rem",
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
              })}
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 8px",
              borderRadius: 8,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#dc2626",
              fontWeight: 600,
              fontSize: "0.92rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        <Outlet />
      </main>
    </div>
  );
}
