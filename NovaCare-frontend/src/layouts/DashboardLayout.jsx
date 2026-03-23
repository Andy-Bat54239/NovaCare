import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Pill, Package, ShoppingCart, Users, FileText,
  BarChart3, Settings, LogOut, Menu, X, Bell, MessageSquare,
  ClipboardList, Activity, ChevronRight
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

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, hasPermission, getRoleName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          </div>
          <div className="topbar-right">
            <button className="topbar-btn">
              <Bell size={20} />
              <span className="notification-dot" />
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
