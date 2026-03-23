import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sales } from '../../data/sales';
import { medicines } from '../../data/medicines';
import { branches } from '../../data/branches';
import { DollarSign, TrendingUp, ShoppingCart, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { hasPermission } = useAuth();
  const [period, setPeriod] = useState('Monthly');

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
    const avgSale = totalRevenue / sales.length;
    const itemCounts = {};
    sales.forEach(s => s.items.forEach(i => { itemCounts[i.medicineId] = (itemCounts[i.medicineId] || 0) + i.quantity; }));
    const topMedId = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topMed = medicines.find(m => m.id === Number(topMedId));
    return { totalSales: sales.length, totalRevenue, avgSale, topMedicine: topMed?.brandName || 'N/A' };
  }, []);

  const trendData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date('2026-03-23');
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.saleDate.startsWith(ds));
      days.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: daySales.reduce((s, sale) => s + sale.totalAmount, 0), count: daySales.length });
    }
    return days;
  }, []);

  const paymentData = useMemo(() => {
    const counts = {};
    sales.forEach(s => { counts[s.paymentMethod] = (counts[s.paymentMethod] || 0) + s.totalAmount; });
    return Object.entries(counts).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, []);

  const branchData = useMemo(() =>
    branches.filter(b => b.isActive).map(b => ({
      name: b.name.split(' ').slice(0, 2).join(' '),
      revenue: sales.filter(s => s.branchId === b.id).reduce((sum, s) => sum + s.totalAmount, 0),
    })), []);

  const topMeds = useMemo(() => {
    const counts = {};
    sales.forEach(s => s.items.forEach(i => { counts[i.medicineId] = (counts[i.medicineId] || 0) + i.quantity; }));
    return Object.entries(counts).map(([id, qty]) => ({ name: medicines.find(m => m.id === Number(id))?.brandName || '?', quantity: qty })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }, []);

  const exportCSV = () => {
    const header = 'Invoice,Date,Customer,Total,Payment\n';
    const rows = sales.map(s => `${s.invoiceNumber},${s.saleDate},${s.customerId || 'Walk-in'},${s.totalAmount},${s.paymentMethod}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sales_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Reports</h1><p className="page-header-subtitle">Sales analytics and insights</p></div>
        {hasPermission('ExportReports') && <button className="btn btn-primary" onClick={exportCSV}><Download size={18} /> Export CSV</button>}
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-icon primary"><ShoppingCart size={24} /></div><div className="stat-card-info"><h3>{stats.totalSales}</h3><p>Total Sales</p></div></div>
        <div className="stat-card"><div className="stat-card-icon success"><DollarSign size={24} /></div><div className="stat-card-info"><h3>RWF {Math.round(stats.totalRevenue).toLocaleString()}</h3><p>Total Revenue</p></div></div>
        <div className="stat-card"><div className="stat-card-icon accent"><TrendingUp size={24} /></div><div className="stat-card-info"><h3>RWF {Math.round(stats.avgSale).toLocaleString()}</h3><p>Average Sale</p></div></div>
        <div className="stat-card"><div className="stat-card-icon info"><TrendingUp size={24} /></div><div className="stat-card-info"><h3>{stats.topMedicine}</h3><p>Top Medicine</p></div></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenue Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Payment Methods</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenue by Branch</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Top 10 Medicines by Quantity Sold</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Medicine</th><th>Units Sold</th></tr></thead>
              <tbody>
                {topMeds.map((m, i) => (
                  <tr key={i}><td>{i + 1}</td><td style={{ fontWeight: 600 }}>{m.name}</td><td><span className="badge badge-primary">{m.quantity}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
