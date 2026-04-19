import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCustomers, createCustomer, updateCustomer } from '../../api/customers';
import { Search, UserPlus, Edit, X, Save, RefreshCw } from 'lucide-react';

export default function Customers() {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    customers.filter(c => {
      return !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
    }), [customers, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', email: '', phone: '', address: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const updated = await updateCustomer(editId, form);
        setCustomers(prev => prev.map(c => c.id === editId ? { ...c, ...updated } : c));
      } else {
        const created = await createCustomer(form);
        setCustomers(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading customers...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="page-header-subtitle">{customers.length} registered customers</p>
        </div>
        {hasPermission('CreateCustomers') && (
          <button className="btn btn-primary" onClick={openAdd}><UserPlus size={18} /> Add Customer</button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Since</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}>No customers found</td></tr>
            ) : paginated.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>
                  {c.name}
                  {c.isPortalOnly && (
                    <span className="badge badge-info" style={{ marginLeft: 8, fontSize: 10 }}>Portal</span>
                  )}
                </td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td className="text-muted">{c.address || '—'}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <div className="table-actions">
                    {hasPermission('EditCustomers') && !c.isPortalOnly && (
                      <button className="btn-icon" onClick={() => openEdit(c)}><Edit size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit' : 'Add'} Customer</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" required placeholder="e.g. Mugisha Jean" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
