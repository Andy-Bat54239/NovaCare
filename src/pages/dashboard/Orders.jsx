import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrders, updateOrderStatus, uploadPrescriptionForItem } from '../../api/orders';
import { ChevronDown, ChevronUp, Check, X, FileText, Image, ZoomIn, Download, AlertCircle, RefreshCw, Upload } from 'lucide-react';

const API_BASE = 'http://localhost:5232';

// Prescription Viewer Modal
function PrescriptionModal({ order, item, onClose }) {
  const medicineName = item?.medicine?.brandName || `Medicine #${item?.medicineId}`;
  // Support both server-path (DB orders) and base64 (legacy localStorage orders)
  const src = item?.prescriptionImagePath
    ? `${API_BASE}${item.prescriptionImagePath}`
    : item?.prescriptionDataUrl || null;
  const fileName = item?.prescriptionFileName || item?.prescriptionName || 'prescription';
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, maxWidth: 680, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ margin: 0 }}>Prescription — {medicineName}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order #{order.id} · {order.customerName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><X size={22} /></button>
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Customer: </span><strong>{order.customerName}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Email: </span>{order.customerEmail}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Phone: </span>{order.customerPhone}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>File: </span>{fileName}</div>
        </div>

        <div style={{ padding: 24 }}>
          {!src ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ marginBottom: 12 }} />
              <p>No prescription image available</p>
            </div>
          ) : isPdf ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <FileText size={48} style={{ color: 'var(--primary)', marginBottom: 12 }} />
              <p style={{ fontWeight: 600, marginBottom: 16 }}>PDF Prescription</p>
              <a href={src} target="_blank" rel="noreferrer" className="btn btn-primary"><Download size={16} /> View PDF</a>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <img src={src} alt="Prescription" style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 10, border: '1px solid var(--border-color)', objectFit: 'contain' }} />
              <div style={{ marginTop: 16 }}>
                <a href={src} download={fileName} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  <Download size={14} /> Download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [uploadingItem, setUploadingItem] = useState(null); // { orderId, itemId }
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];
  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingItem) return;
    e.target.value = '';
    try {
      await uploadPrescriptionForItem(uploadingItem.orderId, uploadingItem.itemId, file);
      // Refresh orders so the new prescriptionImagePath appears
      const data = await getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to upload prescription:', err);
      alert('Failed to upload prescription. Please try again.');
    } finally {
      setUploadingItem(null);
    }
  };

  const statusBadge = (status) => {
    const map = { Pending: 'badge-warning', Approved: 'badge-success', Rejected: 'badge-danger', Completed: 'badge-info' };
    return `badge ${map[status] || 'badge-gray'}`;
  };

  const getPrescriptionItems = (order) => (order.items || []).filter(i => i.prescriptionImagePath || i.prescriptionDataUrl);
  const getRxItems = (order) => (order.items || []).filter(i => i.medicine?.requiresPrescription);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden file input for staff prescription uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        style={{ display: 'none' }}
        onChange={handlePrescriptionUpload}
      />

      {prescriptionModal && (
        <PrescriptionModal order={prescriptionModal.order} item={prescriptionModal.item} onClose={() => setPrescriptionModal(null)} />
      )}

      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p className="page-header-subtitle">{counts.Pending} pending orders</p>
        </div>
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
          <thead>
            <tr>
              <th>#</th><th>Customer</th><th>Branch</th><th>Date</th><th>Total</th><th>Rx</th><th>Status</th><th>Actions</th><th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-muted" style={{ padding: 40 }}>No orders found</td></tr>
            ) : paginated.map(order => {
              const isExpanded = expandedId === order.id;
              const rxItems = getPrescriptionItems(order);
              const allRxItems = getRxItems(order);
              const hasRx = allRxItems.length > 0 || rxItems.length > 0 || order.hasPrescription;
              const branchName = order.branch?.name || `Branch #${order.branchId}`;

              return (
                <React.Fragment key={order.id}>
                  <tr>
                    <td style={{ fontWeight: 600 }}>#{order.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td>{branchName.split(' ').slice(0, 2).join(' ')}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700 }}>RWF {Math.round(order.totalAmount).toLocaleString()}</td>
                    <td>
                      {hasRx ? (
                        rxItems.length > 0 ? (
                          // Prescription uploaded — click to view
                          <span
                            className="badge badge-info"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => setPrescriptionModal({ order, item: rxItems[0] })}
                            title="Click to view prescription"
                          >
                            <Image size={12} /> Rx <ZoomIn size={11} />
                          </span>
                        ) : (
                          // Rx medicine but no prescription uploaded yet
                          <span
                            className="badge badge-warning"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Prescription required but not yet uploaded"
                          >
                            <AlertCircle size={12} /> Rx
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td><span className={statusBadge(order.status)}>{order.status}</span></td>
                    <td>
                      {order.status === 'Pending' && hasPermission('ApproveOrders') && (
                        <div className="table-actions">
                          <button
                            className="btn btn-sm btn-success"
                            disabled={updatingId === order.id}
                            onClick={() => handleStatusUpdate(order.id, 'Approved')}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={updatingId === order.id}
                            onClick={() => handleStatusUpdate(order.id, 'Rejected')}
                          >
                            <X size={14} />
                          </button>
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
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={9} style={{ background: 'var(--bg-secondary)', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16, fontSize: '0.85rem' }}>
                          <div><strong>Phone:</strong> {order.customerPhone || '—'}</div>
                          <div><strong>Branch:</strong> {branchName}</div>
                          <div><strong>Ordered:</strong> {new Date(order.orderDate).toLocaleString()}</div>
                        </div>

                        {rxItems.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Prescriptions
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {rxItems.map((item, idx) => {
                                const src = item.prescriptionImagePath
                                  ? `${API_BASE}${item.prescriptionImagePath}`
                                  : item.prescriptionDataUrl;
                                const isPdf = (item.prescriptionFileName || item.prescriptionName || '').toLowerCase().endsWith('.pdf');
                                return (
                                  <div key={idx} onClick={() => setPrescriptionModal({ order, item })} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 10, cursor: 'pointer', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                    {isPdf ? (
                                      <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={22} color="white" />
                                      </div>
                                    ) : (
                                      <img src={src} alt="rx" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                                    )}
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.medicine?.brandName || `Med #${item.medicineId}`}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.prescriptionFileName || item.prescriptionName || 'prescription'}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                        <ZoomIn size={10} /> Click to view
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <table className="data-table">
                          <thead>
                            <tr><th>Medicine</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th><th>Rx</th></tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((item, i) => (
                              <tr key={i}>
                                <td>
                                  {item.medicine?.brandName || `Medicine #${item.medicineId}`}
                                  {item.medicine?.requiresPrescription && (
                                    <span className="badge badge-warning" style={{ marginLeft: 6, fontSize: '0.65rem', verticalAlign: 'middle' }}>Rx</span>
                                  )}
                                </td>
                                <td>{item.quantity}</td>
                                <td>RWF {Math.round(item.unitPrice || 0).toLocaleString()}</td>
                                <td>RWF {Math.round((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</td>
                                <td>
                                  {(item.prescriptionImagePath || item.prescriptionDataUrl) ? (
                                    <span className="badge badge-info" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }} onClick={() => setPrescriptionModal({ order, item })}>
                                      <Image size={11} /> View Rx
                                    </span>
                                  ) : item.medicine?.requiresPrescription ? (
                                    <button
                                      className="badge badge-warning"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', cursor: 'pointer' }}
                                      title="Upload prescription received from customer"
                                      onClick={() => {
                                        setUploadingItem({ orderId: order.id, itemId: item.id });
                                        fileInputRef.current?.click();
                                      }}
                                    >
                                      <Upload size={11} /> Upload Rx
                                    </button>
                                  ) : '—'}
                                </td>
                              </tr>
                            ))}
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
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
