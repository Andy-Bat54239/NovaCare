import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { users as initialUsers, getRoleName } from '../../data/users';
import { branches } from '../../data/branches';
import { permissions } from '../../data/permissions';
import { rolePermissions } from '../../data/permissions';
import { UserPlus, Edit, Shield, X, Save } from 'lucide-react';

export default function Users() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showPerms, setShowPerms] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 3, branchId: 1, password: '', isActive: true });

  const totalPages = Math.ceil(initialUsers.length / perPage);
  const paginated = initialUsers.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => { setEditId(null); setForm({ firstName: '', lastName: '', email: '', role: 3, branchId: 1, password: '', isActive: true }); setShowModal(true); };
  const openEdit = (u) => { setEditId(u.id); setForm({ ...u, password: '' }); setShowModal(true); };
  const handleSave = (e) => { e.preventDefault(); console.log('Save user:', form); setShowModal(false); alert('User saved!'); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Users</h1><p className="page-header-subtitle">{initialUsers.length} staff members</p></div>
        {hasPermission('CreateUsers') && <button className="btn btn-primary" onClick={openAdd}><UserPlus size={18} /> Add User</button>}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {paginated.map(u => {
              const branch = branches.find(b => b.id === u.branchId);
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 1 ? 'badge-primary' : u.role === 2 ? 'badge-info' : 'badge-gray'}`}>{getRoleName(u.role)}</span></td>
                  <td>{branch?.name?.split(' ').slice(0, 2).join(' ')}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="table-actions">
                      {hasPermission('EditUsers') && <button className="btn-icon" onClick={() => openEdit(u)} title="Edit"><Edit size={16} /></button>}
                      {hasPermission('ManagePermissions') && <button className="btn-icon" onClick={() => setShowPerms(u)} title="Permissions"><Shield size={16} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, initialUsers.length)} of {initialUsers.length}</span>
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
            <div className="modal-header"><h2>{editId ? 'Edit' : 'Add'} User</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name</label><input className="form-input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                {!editId && <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>}
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: Number(e.target.value) })}><option value={1}>Admin</option><option value={2}>Manager</option><option value={3}>Pharmacist</option></select></div>
                  <div className="form-group"><label className="form-label">Branch</label><select className="form-select" value={form.branchId} onChange={e => setForm({ ...form, branchId: Number(e.target.value) })}>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                </div>
                <div className="form-group"><label className="form-checkbox-label"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary"><Save size={18} /> Save</button></div>
            </form>
          </div>
        </div>
      )}

      {showPerms && (
        <div className="modal-overlay" onClick={() => setShowPerms(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Permissions — {showPerms.firstName} {showPerms.lastName}</h2><button className="modal-close" onClick={() => setShowPerms(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <p className="text-muted mb-3">Role: {getRoleName(showPerms.role)} — default permissions shown below</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {permissions.map(p => {
                  const has = (rolePermissions[showPerms.role] || []).includes(p.name);
                  return (
                    <label key={p.id} className="form-checkbox-label" style={{ padding: 8, background: has ? 'var(--success-bg)' : 'var(--gray-50)', borderRadius: 8 }}>
                      <input type="checkbox" defaultChecked={has} onChange={() => console.log('Toggle', p.name)} />
                      {p.description}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowPerms(null)}>Close</button><button className="btn btn-primary" onClick={() => { alert('Permissions saved!'); setShowPerms(null); }}><Save size={18} /> Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
