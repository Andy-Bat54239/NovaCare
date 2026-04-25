import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getSalesChart } from '../../api/dashboard';
import { getSales } from '../../api/sales';
import { getOrders } from '../../api/orders';
import { getUsers } from '../../api/users';
import { getBatches } from '../../api/batches';
import { getMedicines } from '../../api/medicines';
import { getMessages } from '../../api/contactMessages';
import {
  Pill, AlertTriangle, Clock, DollarSign, TrendingUp, Package,
  ShoppingCart, Users as UsersIcon, ClipboardList, MessageSquare,
  Activity, Shield, CheckCircle, ArrowRight, Calendar,
  CreditCard, UserCheck, Star, Target, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ec4899', '#22c55e', '#ef4444'];

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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
      {action && (
        <button onClick={onAction} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 16 }}>
      <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading dashboard...</p>
    </div>
  );
}

function EmptyState({ icon: Icon = Package, message = 'No data available yet', height }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, height: height || '100%', minHeight: height || 120, padding: 24,
    }}>
      <Icon size={32} color="var(--border-color)" strokeWidth={1.5} />
      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>{message}</p>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────
function AdminDashboard({ stats, salesChartData, recentSales, allOrders, allUsers, navigate }) {
  const usersByRole = [
    { name: 'Admin',      value: allUsers.filter(u => u.role === 1 && u.isActive).length },
    { name: 'Manager',    value: allUsers.filter(u => u.role === 2 && u.isActive).length },
    { name: 'Pharmacist', value: allUsers.filter(u => u.role === 3 && u.isActive).length },
  ].filter(d => d.value > 0);

  const orderStatusData = allOrders.reduce((acc, o) => {
    const entry = acc.find(e => e.name === o.status);
    if (entry) entry.value++;
    else acc.push({ name: o.status, value: 1 });
    return acc;
  }, []);

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard icon={DollarSign} value={`RWF ${Math.round(stats.totalRevenue || 0).toLocaleString()}`} label="Total Revenue" color="#22c55e" />
        <StatCard icon={Pill} value={stats.totalMedicines || 0} label="Total Medicines" color="#0d9488" />
        <StatCard icon={UsersIcon} value={stats.activeUsers || 0} label="Active Users" color="#6366f1" />
        <StatCard icon={ClipboardList} value={stats.pendingOrders || 0} label="Pending Orders" color="#f59e0b" />
        <StatCard icon={AlertTriangle} value={stats.lowStock || 0} label="Low Stock Alerts" color="#ef4444" />
        <StatCard icon={MessageSquare} value={stats.unreadMessages || 0} label="Unread Messages" color="#ec4899" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Revenue Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesChartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="salesRevenue"  name="Sales"          stroke="#0d9488" fillOpacity={1} fill="url(#colorSales)"  stackId="1" />
              <Area type="monotone" dataKey="ordersRevenue" name="Approved Orders" stroke="#6366f1" fillOpacity={1} fill="url(#colorOrders)" stackId="1" />
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
          <h3><ClipboardList size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Order Status Overview</h3>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={ClipboardList} message="No orders yet" height={280} />
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction icon={UsersIcon} label="Manage Users" description="Add, edit, or deactivate staff accounts" onClick={() => navigate('/dashboard/users')} color="#6366f1" />
            <QuickAction icon={Shield} label="Audit Log" description="Review system activity and changes" onClick={() => navigate('/dashboard/audit-log')} color="#ef4444" />
            <QuickAction icon={MessageSquare} label="Contact Messages" description={`${stats.unreadMessages || 0} unread messages`} onClick={() => navigate('/dashboard/contact-messages')} color="#ec4899" />
            <QuickAction icon={Activity} label="System Settings" description="Configure pharmacy system preferences" onClick={() => navigate('/dashboard/settings')} color="#0d9488" />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <SectionHeader title="Recent Sales" action actionLabel="View All" onAction={() => navigate('/dashboard/sales')} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            {recentSales.length === 0 ? (
              <EmptyState icon={ShoppingCart} message="No sales recorded yet" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {recentSales.slice(0, 5).map(sale => (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {Math.round(sale.totalAmount).toLocaleString()}</td>
                      <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <SectionHeader title="Recent Orders" action actionLabel="View All" onAction={() => navigate('/dashboard/orders')} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            {allOrders.length === 0 ? (
              <EmptyState icon={ClipboardList} message="No orders received yet" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {allOrders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {Math.round(order.totalAmount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${order.status === 'Completed' ? 'badge-success' : order.status === 'Pending' ? 'badge-warning' : order.status === 'Approved' ? 'badge-primary' : 'badge-danger'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Manager Dashboard ──────────────────────────────────────────────
function ManagerDashboard({ stats, salesChartData, branchSales, branchOrders, branchTeam, branchBatches, navigate, currentUser }) {
  const medicines = {};
  branchBatches.forEach(b => {
    if (b.medicine) medicines[b.medicineId] = b.medicine;
  });

  const lowStockBatches = branchBatches.filter(b => b.remainingQuantity < 10 && b.remainingQuantity > 0);
  const expiringSoon = branchBatches.filter(b => {
    const exp = new Date(b.expiryDate);
    const today = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    return exp > today && exp <= ninetyDays && b.remainingQuantity > 0;
  });

  const paymentMethods = branchSales.reduce((acc, s) => {
    const entry = acc.find(e => e.name === s.paymentMethod);
    if (entry) entry.value++;
    else acc.push({ name: s.paymentMethod || 'Unknown', value: 1 });
    return acc;
  }, []);

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard icon={DollarSign} value={`RWF ${Math.round(stats.branchRevenue || 0).toLocaleString()}`} label="Branch Revenue" color="#22c55e" />
        <StatCard icon={ShoppingCart} value={stats.branchSales || 0} label="Branch Sales" color="#0d9488" />
        <StatCard icon={ClipboardList} value={stats.branchOrders || 0} label="Pending Orders" color="#f59e0b" />
        <StatCard icon={UserCheck} value={stats.branchStaff || 0} label="Active Staff" color="#6366f1" />
        <StatCard icon={AlertTriangle} value={stats.lowStock || 0} label="Low Stock Items" color="#ef4444" />
        <StatCard icon={Clock} value={stats.expiringSoon || 0} label="Expiring Soon" color="#ec4899" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Branch Revenue (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="salesRevenue"  name="Sales"          fill="#0d9488" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="ordersRevenue" name="Approved Orders" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><CreditCard size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Payment Methods</h3>
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentMethods} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={CreditCard} message="No payment data yet" height={280} />
          )}
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction icon={ShoppingCart} label="New Sale" description="Process a new sale transaction" onClick={() => navigate('/dashboard/sales/new')} color="#22c55e" />
            <QuickAction icon={ClipboardList} label="Review Orders" description={`${stats.branchOrders || 0} orders awaiting approval`} onClick={() => navigate('/dashboard/orders')} color="#f59e0b" />
            <QuickAction icon={Package} label="Check Inventory" description="View medicine stock and batches" onClick={() => navigate('/dashboard/batches')} color="#0d9488" />
            <QuickAction icon={MessageSquare} label="View Messages" description="Check customer inquiries" onClick={() => navigate('/dashboard/contact-messages')} color="#6366f1" />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Branch Team ({branchTeam.length} active)</h3></div>
          <div className="card-body">
            {branchTeam.length === 0 ? (
              <EmptyState icon={UsersIcon} message="No staff members found" />
            ) : (
              branchTeam.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {user.role === 1 ? 'Admin' : user.role === 2 ? 'Manager' : 'Pharmacist'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <SectionHeader title="Recent Branch Orders" action actionLabel="View All" onAction={() => navigate('/dashboard/orders')} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            {branchOrders.length === 0 ? (
              <EmptyState icon={ClipboardList} message="No orders yet" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {branchOrders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {Math.round(order.totalAmount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${order.status === 'Completed' ? 'badge-success' : order.status === 'Pending' ? 'badge-warning' : order.status === 'Approved' ? 'badge-primary' : 'badge-danger'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <SectionHeader title="Low Stock Alerts" />
          </div>
          <div className="card-body">
            {lowStockBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <CheckCircle size={32} color="#22c55e" style={{ marginBottom: 8 }} />
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>All stock levels healthy</p>
              </div>
            ) : (
              lowStockBatches.slice(0, 5).map(batch => (
                <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{batch.medicine?.brandName || `Med #${batch.medicineId}`}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch: {batch.batchNumber}</div>
                  </div>
                  <span className="badge badge-danger">{batch.remainingQuantity} left</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Pharmacist Dashboard ───────────────────────────────────────────
function PharmacistDashboard({ stats, salesChartData, mySales, navigate }) {
  const topMedicines = (() => {
    const counts = {};
    mySales.forEach(s => {
      (s.items || []).forEach(item => {
        const name = item.medicine?.brandName || `Med #${item.medicineId}`;
        counts[name] = (counts[name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  })();

  return (
    <>
      <div className="stats-grid">
        <StatCard icon={DollarSign} value={`RWF ${Math.round(stats.myTodayRevenue || 0).toLocaleString()}`} label="My Sales Today" color="#22c55e" subtitle={`${stats.myTodaySales || 0} transactions`} />
        <StatCard icon={Target} value={`RWF ${Math.round(stats.myTotalRevenue || 0).toLocaleString()}`} label="My Total Revenue" color="#0d9488" />
        <StatCard icon={ShoppingCart} value={stats.myTotalSales || 0} label="My Total Sales" color="#6366f1" />
        <StatCard icon={ClipboardList} value={stats.pendingOrders || 0} label="Pending Orders" color="#f59e0b" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Branch Revenue (7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><Star size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />My Top Sold Medicines</h3>
          {topMedicines.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topMedicines} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Star} message="No sales data yet" height={260} />
          )}
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
            {mySales.length === 0 ? (
              <EmptyState icon={ShoppingCart} message="No sales recorded yet" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {mySales.slice(0, 5).map(sale => (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>RWF {Math.round(sale.totalAmount).toLocaleString()}</td>
                      <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────
export default function Dashboard() {
  const { currentUser, getRoleName, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [branchBatches, setBranchBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatChartDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    // ── Step 1: primary data — stats + chart (must succeed) ──────────────
    try {
      const [statsData, chartRaw] = await Promise.all([
        getDashboardStats(),
        getSalesChart(7),
      ]);
      setStats(statsData);
      setChartData((chartRaw || []).map(d => ({
        date:          formatChartDate(d.date),
        revenue:       d.revenue,
        salesRevenue:  d.salesRevenue,
        ordersRevenue: d.ordersRevenue,
        count:         d.count,
      })));
    } catch (err) {
      console.error('Dashboard stats error:', err);
      const status = err?.response?.status;
      if (status === 401) {
        setError('Your session has expired. Please log out and log back in.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
      setLoading(false);
      return;
    }

    // ── Step 2: secondary data — tables / charts (fail gracefully) ────────
    try {
      if (currentUser.role === 1) {
        const [salesData, ordersData, usersData] = await Promise.all([
          getSales(),
          getOrders(),
          getUsers(),
        ]);
        setRecentSales(salesData || []);
        setAllOrders(ordersData || []);
        setAllUsers(usersData || []);
      } else if (currentUser.role === 2) {
        const [salesData, ordersData, usersData, batchData] = await Promise.all([
          getSales({ branchId: currentUser.branchId }),
          getOrders(),
          getUsers(),
          getBatches({ branchId: currentUser.branchId }),
        ]);
        setRecentSales(salesData || []);
        setAllOrders((ordersData || []).filter(o => o.branchId === currentUser.branchId));
        setAllUsers((usersData || []).filter(u => u.branchId === currentUser.branchId && u.isActive));
        setBranchBatches(batchData || []);
      } else {
        const salesData = await getSales();
        setRecentSales((salesData || []).filter(s => s.userId === currentUser.id));
      }
    } catch (err) {
      console.error('Dashboard secondary data error:', err);
      // Don't block the page — stats already loaded; show a soft warning
      setError('Some dashboard sections could not load. Retry to refresh.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const roleName = getRoleName();
  const roleSubtitle = {
    Admin: "Full system overview and administration controls",
    Manager: "Branch performance and team management",
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
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1 }}>{error}</span>
          {error.includes('session') ? (
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ background: 'none', border: '1px solid #dc2626', borderRadius: 6, color: '#dc2626', cursor: 'pointer', fontWeight: 600, padding: '4px 12px', fontSize: '0.85rem' }}>
              Log Out
            </button>
          ) : (
            <button onClick={loadData}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {currentUser?.role === 1 && (
            <AdminDashboard
              stats={stats}
              salesChartData={chartData}
              recentSales={recentSales}
              allOrders={allOrders}
              allUsers={allUsers}
              navigate={navigate}
            />
          )}
          {currentUser?.role === 2 && (
            <ManagerDashboard
              stats={stats}
              salesChartData={chartData}
              branchSales={recentSales}
              branchOrders={allOrders}
              branchTeam={allUsers}
              branchBatches={branchBatches}
              navigate={navigate}
              currentUser={currentUser}
            />
          )}
          {currentUser?.role === 3 && (
            <PharmacistDashboard
              stats={stats}
              salesChartData={chartData}
              mySales={recentSales}
              navigate={navigate}
            />
          )}
        </>
      )}
    </div>
  );
}
