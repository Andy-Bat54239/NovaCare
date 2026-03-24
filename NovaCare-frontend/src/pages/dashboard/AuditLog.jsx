import { useState, useMemo } from 'react';
import { auditLogs } from '../../data/auditLogs';
import { users } from '../../data/users';
import { Search, Activity } from 'lucide-react';

export default function AuditLog() {
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const actions = [...new Set(auditLogs.map(l => l.action))];

  const filtered = useMemo(() =>
    auditLogs
      .filter(l => (!userFilter || l.userId === Number(userFilter)) && (!actionFilter || l.action === actionFilter))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [userFilter, actionFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="page-header"><div><h1>Audit Log</h1><p className="page-header-subtitle">System activity history</p></div></div>

      <div className="filters-bar">
        <select className="filter-select" value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }}>
          <option value="">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
        </select>
        <select className="filter-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            {paginated.map(log => {
              const user = users.find(u => u.id === log.userId);
              return (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{user ? `${user.firstName} ${user.lastName}` : 'System'}</td>
                  <td><span className="badge badge-gray"><Activity size={12} /> {log.action}</span></td>
                  <td className="text-muted">{log.details}</td>
                </tr>
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
