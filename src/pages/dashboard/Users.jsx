import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, createUser, updateUser, resetUserPassword, getUserPermissions, setUserPermissions } from '../../api/users';
import { getBranches } from '../../api/branches';
import { permissions } from '../../data/permissions';
import { UserPlus, Edit, Shield, X, Save, RefreshCw, Key, RotateCcw } from 'lucide-react';

const getRoleName = (role) => role === 1 ? 'Admin' : role === 2 ? 'Manager' : role === 3 ? 'Pharmacist' : 'Customer';

export default function Users() {
  const { hasPermission, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 3, branchId: 1, isActive: true });
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [permsTarget, setPermsTarget] = useState(null);
  const [permsSelected, setPermsSelected] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsSaving, setPermsSaving] = useState(false);
  const [permsError, setPermsError] = useState('');
  const [permsSuccess, setPermsSuccess] = useState('');
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersData, branchData] = await Promise.all([getUsers(), getBranches()]);
      setUsers(usersData || []);
      setBranches((branchData || []).filter(b => b.isActive));
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPages = Math.ceil(users.length / perPage);
  const paginated = users.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditId(null);
    setForm({ firstName: '', lastName: '', email: '', role: 3, branchId: branches[0]?.id || 1, isActive: true });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditId(u.id);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, branchId: u.branchId, isActive: u.isActive });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await updateUser(editId, form);
        setUsers(prev => prev.map(u => u.id === editId ? { ...u, ...form } : u));
      } else {
        const created = await createUser(form);
        setUsers(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const openReset = (u) => {
    setResetTarget(u);
    setResetForm({ newPassword: '', confirmPassword: '' });
    setResetError('');
    setResetSuccess('');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (resetForm.newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    setResetting(true);
    try {
      await resetUserPassword(resetTarget.id, resetForm.newPassword);
      setResetSuccess(`Password reset for ${resetTarget.email}.`);
      setResetForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const openPerms = async (u) => {
    setPermsTarget(u);
    setPermsSelected([]);
    setPermsError('');
    setPermsSuccess('');
    setPermsLoading(true);
    try {
      const perms = await getUserPermissions(u.id);
      setPermsSelected(perms);
    } catch {
      setPermsError('Failed to load permissions.');
    } finally {
      setPermsLoading(false);
    }
  };

  const togglePerm = (name) => {
    setPermsSelected(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
    setPermsSuccess('');
  };

  const handleSavePerms = async () => {
    setPermsSaving(true);
    setPermsError('');
    setPermsSuccess('');
    try {
      await setUserPermissions(permsTarget.id, permsSelected);
      setPermsSuccess('Permissions saved successfully.');
    } catch {
      setPermsError('Failed to save permissions.');
    } finally {
      setPermsSaving(false);
    }
  };

  const isAdmin = currentUser?.role === 1;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Users</h1><p className="page-header-subtitle">{users.length} staff members</p></div>
        {hasPermission('CreateUsers') && (
          <button className="btn btn-primary" onClick={openAdd}><UserPlus size={18} /> Add User</button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}>No users found</td></tr>
            ) : paginated.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 1 ? 'badge-primary' : u.role === 2 ? 'badge-info' : u.role === 3 ? 'badge-gray' : 'badge-success'}`}>
                    {getRoleName(u.role)}
                  </span>
                </td>
                <td>{u.branchName || branches.find(b => b.id === u.branchId)?.name?.split(' ').slice(0, 2).join(' ') || '—'}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    {hasPermission('EditUsers') && (
                      <button className="btn-icon" onClick={() => openEdit(u)} title="Edit"><Edit size={16} /></button>
                    )}
                    {isAdmin && (
                      <button className="btn-icon" onClick={() => openReset(u)} title="Reset password"><Key size={16} /></button>
                    )}
                    {hasPermission('ManagePermissions') && (
                      <button className="btn-icon" onClick={() => openPerms(u)} title="Permissions"><Shield size={16} /></button>
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
          <span className="pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, users.length)} of {users.length}</span>
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
              <h2>{editId ? 'Edit' : 'Add'} User</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: Number(e.target.value) })}>
                      <option value={1}>Admin</option>
                      <option value={2}>Manager</option>
                      <option value={3}>Pharmacist</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" value={form.branchId} onChange={e => setForm({ ...form, branchId: Number(e.target.value) })}>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                    Active
                  </label>
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

      {resetTarget && (
        <div className="modal-overlay" onClick={() => setResetTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="modal-close" onClick={() => setResetTarget(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleReset}>
              <div className="modal-body">
                <p className="text-muted" style={{ marginTop: 0, marginBottom: 16 }}>
                  Set a new password for <strong>{resetTarget.firstName} {resetTarget.lastName}</strong> ({resetTarget.email}).
                  They will need to sign in with the new password.
                </p>
                {resetError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{resetError}</div>}
                {resetSuccess && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{resetSuccess}</div>}
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    minLength={6}
                    value={resetForm.newPassword}
                    onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    value={resetForm.confirmPassword}
                    onChange={e => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResetTarget(null)}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={resetting}>
                  <Key size={18} /> {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {permsTarget && (
        <div className="modal-overlay" onClick={() => setPermsTarget(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Permissions — {permsTarget.firstName} {permsTarget.lastName}</h2>
              <button className="modal-close" onClick={() => setPermsTarget(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ marginTop: 0, marginBottom: 16 }}>
                Role: <strong>{getRoleName(permsTarget.role)}</strong> — toggle individual permissions below. Changes take effect on the user's next login.
              </p>
              {permsError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{permsError}</div>}
              {permsSuccess && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{permsSuccess}</div>}
              {permsLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading permissions...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
                  {permissions.map(p => {
                    const checked = permsSelected.includes(p.name);
                    return (
                      <label
                        key={p.id}
                        className="form-checkbox-label"
                        style={{ padding: '8px 10px', background: checked ? 'var(--success-bg, #f0fdf4)' : 'var(--gray-50, #f9fafb)', borderRadius: 8, cursor: 'pointer', border: checked ? '1px solid #bbf7d0' : '1px solid transparent' }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePerm(p.name)}
                        />
                        {p.description}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={permsLoading || permsSaving}
                onClick={async () => {
                  setPermsLoading(true);
                  try { const p = await getUserPermissions(permsTarget.id); setPermsSelected(p); setPermsSuccess(''); setPermsError(''); }
                  finally { setPermsLoading(false); }
                }}
                title="Reload from server"
              >
                <RotateCcw size={15} /> Reset
              </button>
              <div style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={() => setPermsTarget(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={permsLoading || permsSaving}
                onClick={handleSavePerms}
              >
                <Save size={16} /> {permsSaving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
