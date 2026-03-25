import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Pill, Package, ShoppingCart, Users, FileText,
  BarChart3, Settings, LogOut, Menu, X, Bell, MessageSquare,
  ClipboardList, Activity, ChevronRight, Search, Sun, Moon
} from 'lucide-react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'ViewDashboard', end: true },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/dashboard/medicines', icon: Pill, label: 'Medicines', permission: 'ViewMedicines' },
      { to: '/dashboard/batches', icon: Package, label: 'Batches', permission: 'ViewBatches' },
    ],
  },
  {
    title: 'Sales & Orders',
    items: [
      { to: '/dashboard/sales', icon: ShoppingCart, label: 'Sales', permission: 'ViewSales' },
      { to: '/dashboard/customers', icon: Users, label: 'Customers', permission: 'ViewCustomers' },
      { to: '/dashboard/orders', icon: ClipboardList, label: 'Orders', permission: 'ViewOrders' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { to: '/dashboard/reports', icon: BarChart3, label: 'Reports', permission: 'ViewReports' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/dashboard/users', icon: Users, label: 'Users', permission: 'ViewUsers' },
      { to: '/dashboard/contact-messages', icon: MessageSquare, label: 'Messages', permission: 'ViewContactMessages' },
      { to: '/dashboard/audit-log', icon: Activity, label: 'Audit Log', permission: 'ViewAuditLog' },
      { to: '/dashboard/settings', icon: Settings, label: 'Settings', permission: 'ManageSettings' },
    ],
  },
];

// Searchable items mapping query terms to dashboard routes
const searchableItems = [
  { label: 'Dashboard', keywords: ['dashboard', 'home', 'overview'], path: '/dashboard' },
  { label: 'Medicines', keywords: ['medicine', 'drug', 'inventory', 'stock', 'pharmaceutical'], path: '/dashboard/medicines', permission: 'ViewMedicines' },
  { label: 'Add Medicine', keywords: ['add medicine', 'new medicine', 'create medicine'], path: '/dashboard/medicines/new', permission: 'CreateMedicines' },
  { label: 'Batches', keywords: ['batch', 'lot', 'expiry', 'expiring'], path: '/dashboard/batches', permission: 'ViewBatches' },
  { label: 'Add Batch', keywords: ['add batch', 'new batch', 'create batch'], path: '/dashboard/batches/new', permission: 'CreateBatches' },
  { label: 'Sales', keywords: ['sale', 'transaction', 'revenue', 'invoice'], path: '/dashboard/sales', permission: 'ViewSales' },
  { label: 'New Sale', keywords: ['new sale', 'create sale', 'pos', 'point of sale'], path: '/dashboard/sales/new', permission: 'CreateSales' },
  { label: 'Customers', keywords: ['customer', 'client', 'buyer'], path: '/dashboard/customers', permission: 'ViewCustomers' },
  { label: 'Orders', keywords: ['order', 'pending', 'approved'], path: '/dashboard/orders', permission: 'ViewOrders' },
  { label: 'Reports', keywords: ['report', 'analytics', 'chart', 'statistics'], path: '/dashboard/reports', permission: 'ViewReports' },
  { label: 'Users', keywords: ['user', 'staff', 'employee', 'account'], path: '/dashboard/users', permission: 'ViewUsers' },
  { label: 'Messages', keywords: ['message', 'contact', 'inquiry', 'email'], path: '/dashboard/contact-messages', permission: 'ViewContactMessages' },
  { label: 'Audit Log', keywords: ['audit', 'log', 'activity', 'history'], path: '/dashboard/audit-log', permission: 'ViewAuditLog' },
  { label: 'Settings', keywords: ['setting', 'config', 'preference', 'profile'], path: '/dashboard/settings', permission: 'ManageSettings' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const { currentUser, logout, hasPermission, getRoleName } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter search results based on query and user permissions
  const searchResults = searchQuery.trim().length > 0
    ? searchableItems.filter(item => {
        if (item.permission && !hasPermission(item.permission)) return false;
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q));
      })
    : [];

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchFocused(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : '??';

  return (
    <div className="dashboard-wrapper">
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">NC</div>
          <div className="sidebar-brand-text">Nova<span>Care</span></div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} style={{ display: 'none', marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              item => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                <div className="sidebar-section-title">{section.title}</div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.firstName} {currentUser?.lastName}</div>
              <div className="sidebar-user-role">{getRoleName()}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="topbar-search" ref={searchRef}>
              <Search size={16} className="topbar-search-icon" />
              <input
                type="text"
                placeholder="Search medicines, orders, reports..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="topbar-search-input"
              />
              {searchFocused && searchResults.length > 0 && (
                <div className="topbar-search-dropdown">
                  {searchResults.map(item => (
                    <button key={item.path} className="topbar-search-item" onClick={() => handleSearchSelect(item.path)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {searchFocused && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                <div className="topbar-search-dropdown">
                  <div className="topbar-search-empty">No results found</div>
                </div>
              )}
            </div>
          </div>
          <div className="topbar-right">
            <div className="notification-wrapper" ref={notifRef}>
              <button className="topbar-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-dot" />}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="notification-mark-all" onClick={markAllAsRead}>Mark all read</button>
                    )}
                  </div>
                  <div className="notification-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <button key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => markAsRead(n.id)}>
                          <div className="notification-item-title">{n.title}</div>
                          <div className="notification-item-message">{n.message}</div>
                          <div className="notification-item-time">{n.time}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="topbar-btn" onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="topbar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
