import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orders as initialOrders } from '../../data/orders';
import { medicines } from '../../data/medicines';
import { branches } from '../../data/branches';
import { ChevronDown, ChevronUp, Check, X, FileText, Image } from 'lucide-react';

export default function Orders() {
  const { hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [ordersState, setOrdersState] = useState(initialOrders);

  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];
  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === 'All' ? ordersState.length : ordersState.filter(o => o.status === s).length;
    return acc;
  }, {});

  const filtered = statusFilter === 'All' ? ordersState : ordersState.filter(o => o.status === statusFilter);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const updateStatus = (id, status) => {
    setOrdersState(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const statusBadge = (status) => {
    const map = { Pending: 'badge-warning', Approved: 'badge-success', Rejected: 'badge-danger', Completed: 'badge-info' };
    return `badge ${map[status] || 'badge-gray'}`;
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Orders</h1><p className="page-header-subtitle">{counts.Pending} pending orders</p></div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        {statuses.map(s => (
          <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Customer</th><th>Branch</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th><th></th></tr></thead>
          <tbody>
            {paginated.map(order => {
              const branch = branches.find(b => b.id === order.branchId);
              const isExpanded = expandedId === order.id;
              return (
                <React.Fragment key={order.id}>
                  <tr>
                    <td style={{ fontWeight: 600 }}>#{order.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td>{branch?.name?.split(' ').slice(0, 2).join(' ')}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700 }}>RWF {order.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={statusBadge(order.status)}>
                        {order.prescriptionImage && <Image size={12} />} {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status === 'Pending' && hasPermission('ApproveOrders') && (
                        <div className="table-actions">
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, 'Approved')}><Check size={14} /> Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => updateStatus(order.id, 'Rejected')}><X size={14} /></button>
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn-ghost" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${order.id}-d`}>
                      <td colSpan={8} style={{ background: 'var(--gray-50)', padding: 16 }}>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                          <div><strong>Phone:</strong> {order.customerPhone}</div>
                          {order.prescriptionImage && <span className="badge badge-info"><Image size={12} /> Prescription Attached</span>}
                        </div>
                        <table className="data-table">
                          <thead><tr><th>Medicine</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                          <tbody>
                            {order.items.map((item, i) => {
                              const med = medicines.find(m => m.id === item.medicineId);
                              return <tr key={i}><td>{med?.brandName}</td><td>{item.quantity}</td><td>RWF {item.unitPrice.toLocaleString()}</td><td>RWF {(item.quantity * item.unitPrice).toLocaleString()}</td></tr>;
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
