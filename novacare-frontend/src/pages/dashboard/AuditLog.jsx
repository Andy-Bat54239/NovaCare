import { useState, useEffect, useMemo } from 'react';
import { getAuditLogs } from '../../api/auditLogs';
import { getUsers } from '../../api/users';
import { Activity, RefreshCw } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    Promise.all([getAuditLogs(), getUsers().catch(() => [])])
      .then(([logData, userData]) => {
        setLogs(logData || []);
        setUsers(userData || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load audit logs.'))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const modules = useMemo(() => [...new Set(logs.map((l) => l.module))].sort(), [logs]);

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (!userFilter || l.userId === Number(userFilter)) &&
          (!actionFilter || l.action === actionFilter) &&
          (!moduleFilter || l.module === moduleFilter),
      ),
    [logs, userFilter, actionFilter, moduleFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const badgeClass = (action) => {
    if (/^Created/i.test(action)) return 'badge-success';
    if (/^Deleted/i.test(action)) return 'badge-danger';
    if (/^Updated|PasswordChanged/i.test(action)) return 'badge-primary';
    if (/^Login|Logout/i.test(action)) return 'badge-gray';
    if (/Approved/i.test(action)) return 'badge-success';
    if (/Rejected/i.test(action)) return 'badge-danger';
    return 'badge-gray';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p className="page-header-subtitle">System activity history</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filters-bar">
        <select className="filter-select" value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}>
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>
        <select className="filter-select" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="filter-select" value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: 40 }}>No activity recorded yet.</td></tr>
                ) : paginated.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{log.userName || 'System'}</td>
                    <td><span className={`badge ${badgeClass(log.action)}`}><Activity size={12} /> {log.action}</span></td>
                    <td className="text-muted">{log.module}</td>
                    <td className="text-muted">{log.details}</td>
                    <td className="text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination-buttons">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
