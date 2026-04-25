import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Mail,
  ClipboardList,
  Activity,
  ChevronRight,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { getUnreadCount } from "../api/chat";
import { getContactUnreadCount } from "../api/contactMessages";
import { startConnection } from "../api/signalr";

const navSections = [
  {
    title: "Overview",
    items: [
      {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        permission: "ViewDashboard",
        end: true,
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        to: "/dashboard/medicines",
        icon: Pill,
        label: "Medicines",
        permission: "ViewMedicines",
      },
      {
        to: "/dashboard/batches",
        icon: Package,
        label: "Batches",
        permission: "ViewBatches",
      },
    ],
  },
  {
    title: "Sales & Orders",
    items: [
      {
        to: "/dashboard/sales",
        icon: ShoppingCart,
        label: "Sales",
        permission: "ViewSales",
      },
      {
        to: "/dashboard/customers",
        icon: Users,
        label: "Customers",
        permission: "ViewCustomers",
      },
      {
        to: "/dashboard/orders",
        icon: ClipboardList,
        label: "Orders",
        permission: "ViewOrders",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        to: "/dashboard/reports",
        icon: BarChart3,
        label: "Reports",
        permission: "ViewReports",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        to: "/dashboard/users",
        icon: Users,
        label: "Users",
        permission: "ViewUsers",
      },
      {
        to: "/dashboard/chats",
        icon: MessageSquare,
        label: "Chats",
        permission: "ViewDashboard",
      },
      {
        to: "/dashboard/audit-log",
        icon: Activity,
        label: "Audit Log",
        permission: "ViewAuditLog",
      },
      {
        to: "/dashboard/settings",
        icon: Settings,
        label: "Settings",
        permission: "ManageSettings",
      },
    ],
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const { currentUser, logout, hasPermission, getRoleName } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = () => {
      getUnreadCount()
        .then((d) => setChatUnread(d.count || 0))
        .catch(() => {});
    };
    const fetchMessagesUnread = () => {
      getContactUnreadCount()
        .then((d) => setMessagesUnread(d.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    fetchMessagesUnread();
    const interval = setInterval(() => {
      fetchUnread();
      fetchMessagesUnread();
    }, 30000);

    window.addEventListener("novamail-read", fetchMessagesUnread);

    startConnection()
      .then((conn) => {
        // Incoming messages — fetch from server to get the accurate new count
        conn.on("ReceiveMessage", () => fetchUnread());
        conn.on("ReceiveStaffMessage", () => fetchUnread());
        conn.on("NewConversation", () => fetchUnread());
      })
      .catch(() => {});

    // When a conversation is opened, subtract the cleared unread count instantly
    const handleChatRead = (e) => {
      const delta = e.detail?.delta;
      if (delta > 0) {
        setChatUnread((prev) => Math.max(0, prev - delta));
      } else {
        fetchUnread();
      }
    };
    window.addEventListener("novachat-read", handleChatRead);

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (profileDropdownOpen && !e.target.closest("[data-profile-dropdown]")) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => {
      clearInterval(interval);
      window.removeEventListener("novachat-read", handleChatRead);
      window.removeEventListener("novamail-read", fetchMessagesUnread);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : "??";

  return (
    <div className="dashboard-wrapper">
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">NC</div>
          <div className="sidebar-brand-text">
            Nova<span>Care</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission),
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                <div className="sidebar-section-title">{section.title}</div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const showBadge =
                    item.to === "/dashboard/chats" && chatUnread > 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                      }
                      onClick={() => setSidebarOpen(false)}
                      style={{ position: "relative" }}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                      {showBadge && (
                        <span
                          style={{
                            marginLeft: "auto",
                            minWidth: 20,
                            height: 20,
                            borderRadius: 999,
                            background: "var(--danger)",
                            color: "white",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 5px",
                          }}
                        >
                          {chatUnread > 99 ? "99+" : chatUnread}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-hamburger"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
          <div className="topbar-right">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <NotificationBell />
              {hasPermission("ViewContactMessages") && (
                <button
                  onClick={() => navigate("/dashboard/contact-messages")}
                  title="Contact Messages"
                  style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 4px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "var(--text-primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.color = "var(--text-muted)")
                  }
                >
                  <Mail size={20} />
                  {messagesUnread > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 999,
                        background: "var(--danger)",
                        color: "white",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 3px",
                      }}
                    >
                      {messagesUnread > 9 ? "9+" : messagesUnread}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Profile Dropdown */}
            <div
              style={{
                position: "relative",
                borderLeft: "1px solid var(--border-color)",
                paddingLeft: 12,
                marginLeft: 12,
              }}
              data-profile-dropdown
            >
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 8,
                  transition: "background-color 0.2s",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  {currentUser
                    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
                    : "??"}
                </div>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    minWidth: 220,
                    overflow: "hidden",
                  }}
                >
                  {/* User Info Header */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#1f2937",
                      }}
                    >
                      {currentUser?.firstName} {currentUser?.lastName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginTop: 4,
                      }}
                    >
                      {currentUser?.email}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#0d9488",
                        fontWeight: 600,
                        marginTop: 6,
                        display: "inline-block",
                        background: "#d1faf0",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {getRoleName()}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      navigate("/dashboard/settings");
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#1f2937",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <div style={{ borderTop: "1px solid #e5e7eb" }} />

                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#fef2f2")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
