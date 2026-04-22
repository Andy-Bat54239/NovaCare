import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { customers as initialCustomers } from '../../data/customers';
import { Search, Plus, Edit, X, Save, UserPlus } from 'lucide-react';

export default function Customers() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' });

  const filtered = initialCustomers.filter(c => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => { setEditId(null); setForm({ firstName: '', lastName: '', email: '', phone: '', address: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditId(c.id); setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, address: c.address }); setShowModal(true); };
  const handleSave = (e) => { e.preventDefault(); console.log(editId ? 'Update customer:' : 'Create customer:', form); setShowModal(false); alert('Customer saved!'); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Customers</h1><p className="page-header-subtitle">{initialCustomers.length} registered customers</p></div>
        {hasPermission('CreateCustomers') && <button className="btn btn-primary" onClick={openAdd}><UserPlus size={18} /> Add Customer</button>}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper"><Search /><input className="form-input" placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Since</th><th>Actions</th></tr></thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td className="text-muted">{c.address}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td><div className="table-actions">{hasPermission('EditCustomers') && <button className="btn-icon" onClick={() => openEdit(c)}><Edit size={16} /></button>}</div></td>
              </tr>
            ))}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit' : 'Add'} Customer</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name</label><input className="form-input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={18} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
