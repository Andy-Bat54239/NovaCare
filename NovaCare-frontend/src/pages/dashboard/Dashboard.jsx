import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { medicines } from '../../data/medicines';
import { batches } from '../../data/batches';
import { sales } from '../../data/sales';
import { orders } from '../../data/orders';
import { customers } from '../../data/customers';
import { users } from '../../data/users';
import { contactMessages } from '../../data/contactMessages';
import {
  Pill, AlertTriangle, Clock, DollarSign, TrendingUp, Package,
  ShoppingCart, Users as UsersIcon, ClipboardList, MessageSquare,
  Activity, Shield, CheckCircle, XCircle, ArrowRight, Calendar,
  CreditCard, UserCheck, Star, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ec4899', '#22c55e', '#ef4444'];
const today = '2026-03-23';

function QuickAction({ icon: Icon, label, description, onClick, color = 'var(--primary)' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        background: 'var(--card-bg)', border: '1px solid var(--border-color)',
        borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.2s',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
      </div>
      <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </button>
  );
}

function StatCard({ icon: Icon, value, label, color, trend, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}15`, color }}><Icon size={24} /></div>
      <div className="stat-card-info">
        <h3>{value}</h3>
        <p>{label}</p>
        {trend && <span style={{ fontSize: '0.75rem', color: trend > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
        {subtitle && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ title, action, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: 'none', border: 'none', color: 'var(--primary)',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 4,
          }}
        >
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────
function AdminDashboard({ stats, salesChartData, topMedicines, navigate }) {
  const usersByRole = useMemo(() => {
    const roles = { Admin: 0, Manager: 0, Pharmacist: 0 };
    users.forEach(u => {
      if (u.isActive) {
        if (u.role === 1) roles.Admin++;
        else if (u.role === 2) roles.Manager++;
        else if (u.role === 3) roles.Pharmacist++;
      }
    });
    return Object.entries(roles).map(([name, value]) => ({ name, value }));
  }, []);

  const orderStatusData = useMemo(() => {
    const statuses = {};
    orders.forEach(o => { statuses[o.status] = (statuses[o.status] || 0) + 1; });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, []);

  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.totalAmount, 0), []);
  const unreadMessages = contactMessages.filter(m => !m.isRead).length;

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard icon={DollarSign} value={`RWF ${totalRevenue.toLocaleString()}`} label="Total Revenue" color="#22c55e" trend={12} />
        <StatCard icon={Pill} value={medicines.length} label="Total Medicines" color="#0d9488" />
        <StatCard icon={UsersIcon} value={users.filter(u => u.isActive).length} label="Active Users" color="#6366f1" />
        <StatCard icon={ClipboardList} value={stats.pendingOrders} label="Pending Orders" color="#f59e0b" />
        <StatCard icon={AlertTriangle} value={stats.lowStock.length} label="Low Stock Alerts" color="#ef4444" />
        <StatCard icon={MessageSquare} value={unreadMessages} label="Unread Messages" color="#ec4899" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Revenue Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `RWF ${Math.round(value).toLocaleString()}`} />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><UsersIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Staff Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={usersByRole} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {usersByRole.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><Package size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Top Selling Medicines</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topMedicines} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><ClipboardList size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Order Status Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin Quick Actions & Tables */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction icon={UsersIcon} label="Manage Users" description="Add, edit, or deactivate staff accounts" onClick={() => navigate('/dashboard/users')} color="#6366f1" />
            <QuickAction icon={Shield} label="Audit Log" description="Review system activity and changes" onClick={() => navigate('/dashboard/audit-log')} color="#ef4444" />
            <QuickAction icon={MessageSquare} label="Contact Messages" description={`${unreadMessages} unread messages need attention`} onClick={() => navigate('/dashboard/contact-messages')} color="#ec4899" />
            <QuickAction icon={Activity} label="System Settings" description="Configure pharmacy system preferences" onClick={() => navigate('/dashboard/settings')} color="#0d9488" />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Activity</h3></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Payment</th></tr>
              </thead>
              <tbody>
                {sales.slice(-5).reverse().map(sale => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                    <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {sale.totalAmount.toLocaleString()}</td>
                    <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Manager Dashboard ──────────────────────────────────────────────
function ManagerDashboard({ stats, salesChartData, topMedicines, navigate, currentUser }) {
  const branchSales = useMemo(() => {
    return sales.filter(s => s.branchId === currentUser.branchId);
  }, [currentUser.branchId]);

  const branchRevenue = branchSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const branchOrders = orders.filter(o => o.branchId === currentUser.branchId);
  const branchPendingOrders = branchOrders.filter(o => o.status === 'Pending').length;
  const branchCustomerCount = new Set(branchSales.filter(s => s.customerId).map(s => s.customerId)).size;

  const branchSalesChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = branchSales.filter(s => s.saleDate.startsWith(dateStr));
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
        count: daySales.length,
      });
    }
    return days;
  }, [branchSales]);

  const paymentMethods = useMemo(() => {
    const methods = {};
    branchSales.forEach(s => { methods[s.paymentMethod] = (methods[s.paymentMethod] || 0) + 1; });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [branchSales]);

  const branchStaff = users.filter(u => u.branchId === currentUser.branchId && u.isActive);

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard icon={DollarSign} value={`RWF ${branchRevenue.toLocaleString()}`} label="Branch Revenue" color="#22c55e" trend={8} />
        <StatCard icon={ShoppingCart} value={branchSales.length} label="Branch Sales" color="#0d9488" />
        <StatCard icon={ClipboardList} value={branchPendingOrders} label="Pending Orders" color="#f59e0b" />
        <StatCard icon={UserCheck} value={branchCustomerCount} label="Branch Customers" color="#6366f1" />
        <StatCard icon={AlertTriangle} value={stats.lowStock.length} label="Low Stock Items" color="#ef4444" />
        <StatCard icon={Clock} value={stats.expiringSoon.length} label="Expiring Soon" color="#ec4899" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Branch Sales (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchSalesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => typeof value === 'number' && value > 1 ? `RWF ${Math.round(value).toLocaleString()}` : value} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><CreditCard size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Payment Methods</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction icon={ShoppingCart} label="New Sale" description="Process a new sale transaction" onClick={() => navigate('/dashboard/sales/new')} color="#22c55e" />
            <QuickAction icon={ClipboardList} label="Review Orders" description={`${branchPendingOrders} orders awaiting approval`} onClick={() => navigate('/dashboard/orders')} color="#f59e0b" />
            <QuickAction icon={Package} label="Check Inventory" description="View medicine stock and batches" onClick={() => navigate('/dashboard/batches')} color="#0d9488" />
            <QuickAction icon={MessageSquare} label="View Messages" description="Check customer inquiries" onClick={() => navigate('/dashboard/contact-messages')} color="#6366f1" />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Branch Team ({branchStaff.length} active)</h3></div>
          <div className="card-body">
            {branchStaff.map(user => (
              <div key={user.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {user.role === 1 ? 'Admin' : user.role === 2 ? 'Manager' : 'Pharmacist'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <SectionHeader title="Recent Branch Orders" action actionLabel="View All" onAction={() => navigate('/dashboard/orders')} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {branchOrders.slice(-5).reverse().map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {order.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${order.status === 'Completed' ? 'badge-success' : order.status === 'Pending' ? 'badge-warning' : order.status === 'Approved' ? 'badge-primary' : 'badge-danger'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <SectionHeader title="Low Stock Alerts" action actionLabel="View All" onAction={() => navigate('/dashboard/batches')} />
          </div>
          <div className="card-body">
            {stats.lowStock.length === 0 ? (
              <p className="text-muted">No low stock items - inventory is healthy!</p>
            ) : (
              stats.lowStock.slice(0, 5).map(batch => {
                const med = medicines.find(m => m.id === batch.medicineId);
                return (
                  <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{med?.brandName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch: {batch.batchNumber}</div>
                    </div>
                    <span className="badge badge-danger">{batch.remainingQuantity} left</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Pharmacist Dashboard ───────────────────────────────────────────
function PharmacistDashboard({ stats, navigate, currentUser }) {
  const mySales = useMemo(() => {
    return sales.filter(s => s.userId === currentUser.id);
  }, [currentUser.id]);

  const myTodaySales = mySales.filter(s => s.saleDate.startsWith(today));
  const myTodayRevenue = myTodaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const myTotalRevenue = mySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const myWeeklyChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = mySales.filter(s => s.saleDate.startsWith(dateStr));
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
        count: daySales.length,
      });
    }
    return days;
  }, [mySales]);

  const myTopMedicines = useMemo(() => {
    const counts = {};
    mySales.forEach(s => {
      s.items.forEach(item => {
        counts[item.medicineId] = (counts[item.medicineId] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([id, qty]) => {
        const med = medicines.find(m => m.id === Number(id));
        return { name: med?.brandName || 'Unknown', quantity: qty };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [mySales]);

  const branchPendingOrders = orders.filter(o => o.branchId === currentUser.branchId && o.status === 'Pending').length;

  return (
    <>
      <div className="stats-grid">
        <StatCard icon={DollarSign} value={`RWF ${myTodayRevenue.toLocaleString()}`} label="My Sales Today" color="#22c55e" subtitle={`${myTodaySales.length} transactions`} />
        <StatCard icon={Target} value={`RWF ${myTotalRevenue.toLocaleString()}`} label="My Total Revenue" color="#0d9488" />
        <StatCard icon={ShoppingCart} value={mySales.length} label="My Total Sales" color="#6366f1" />
        <StatCard icon={ClipboardList} value={branchPendingOrders} label="Pending Orders" color="#f59e0b" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />My Weekly Performance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={myWeeklyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => typeof value === 'number' && value > 1 ? `RWF ${Math.round(value).toLocaleString()}` : value} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><Star size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />My Top Sold Medicines</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={myTopMedicines} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction icon={ShoppingCart} label="New Sale" description="Start a new point-of-sale transaction" onClick={() => navigate('/dashboard/sales/new')} color="#22c55e" />
            <QuickAction icon={Pill} label="Browse Medicines" description="Look up medicine details and stock" onClick={() => navigate('/dashboard/medicines')} color="#0d9488" />
            <QuickAction icon={Package} label="View Batches" description="Check batch inventory and expiry dates" onClick={() => navigate('/dashboard/batches')} color="#6366f1" />
            <QuickAction icon={ClipboardList} label="View Orders" description="See incoming customer orders" onClick={() => navigate('/dashboard/orders')} color="#f59e0b" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <SectionHeader title="My Recent Sales" action actionLabel="View All" onAction={() => navigate('/dashboard/sales')} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Payment</th></tr>
              </thead>
              <tbody>
                {mySales.slice(-5).reverse().map(sale => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                    <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {sale.totalAmount.toLocaleString()}</td>
                    <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expiry & Low Stock alerts relevant to pharmacist */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <SectionHeader title="Low Stock Alerts" />
          </div>
          <div className="card-body">
            {stats.lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 8 }} />
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>All stock levels are healthy</p>
              </div>
            ) : (
              stats.lowStock.slice(0, 4).map(batch => {
                const med = medicines.find(m => m.id === batch.medicineId);
                return (
                  <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{med?.brandName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch: {batch.batchNumber}</div>
                    </div>
                    <span className="badge badge-danger">{batch.remainingQuantity} left</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <SectionHeader title="Expiring Soon" />
          </div>
          <div className="card-body">
            {stats.expiringSoon.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 8 }} />
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No medicines expiring soon</p>
              </div>
            ) : (
              stats.expiringSoon.slice(0, 4).map(batch => {
                const med = medicines.find(m => m.id === batch.medicineId);
                const daysLeft = Math.ceil((new Date(batch.expiryDate) - new Date(today)) / 86400000);
                return (
                  <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{med?.brandName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exp: {batch.expiryDate}</div>
                    </div>
                    <span className={`badge ${daysLeft <= 30 ? 'badge-danger' : 'badge-warning'}`}>{daysLeft}d left</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────
export default function Dashboard() {
  const { currentUser, getRoleName } = useAuth();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const now = new Date(today);
    const ninetyDays = new Date(now);
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const lowStock = batches.filter(b => b.remainingQuantity < 10 && b.remainingQuantity > 0);
    const expiringSoon = batches.filter(b => {
      const exp = new Date(b.expiryDate);
      return exp > now && exp <= ninetyDays && b.remainingQuantity > 0;
    });
    const todaySales = sales.filter(s => s.saleDate.startsWith(today));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    return { lowStock, expiringSoon, todaySales: todaySales.length, todayRevenue, pendingOrders };
  }, []);

  const salesChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.saleDate.startsWith(dateStr));
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
        count: daySales.length,
      });
    }
    return days;
  }, []);

  const topMedicines = useMemo(() => {
    const counts = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        counts[item.medicineId] = (counts[item.medicineId] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([id, qty]) => {
        const med = medicines.find(m => m.id === Number(id));
        return { name: med?.brandName || 'Unknown', quantity: qty };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, []);

  const roleName = getRoleName();
  const roleSubtitle = {
    Admin: "Full system overview and administration controls",
    Manager: `Branch performance and team management`,
    Pharmacist: "Your sales performance and daily tasks",
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {currentUser?.firstName}!</h1>
          <p className="page-header-subtitle">
            <span className="badge badge-primary" style={{ marginRight: 8, verticalAlign: 'middle' }}>{roleName}</span>
            {roleSubtitle[roleName] || "Here's what's happening at NovaCare today"}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {currentUser?.role === 1 && (
        <AdminDashboard stats={stats} salesChartData={salesChartData} topMedicines={topMedicines} navigate={navigate} />
      )}
      {currentUser?.role === 2 && (
        <ManagerDashboard stats={stats} salesChartData={salesChartData} topMedicines={topMedicines} navigate={navigate} currentUser={currentUser} />
      )}
      {currentUser?.role === 3 && (
        <PharmacistDashboard stats={stats} navigate={navigate} currentUser={currentUser} />
      )}
    </div>
  );
}
