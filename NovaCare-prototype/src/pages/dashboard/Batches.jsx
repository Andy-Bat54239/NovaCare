import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { batches } from '../../data/batches';
import { medicines } from '../../data/medicines';
import { branches } from '../../data/branches';
import { suppliers } from '../../data/suppliers';
import { Plus, Search, AlertTriangle } from 'lucide-react';

export default function Batches() {
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [medFilter, setMedFilter] = useState(searchParams.get('medicine') || '');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const today = new Date('2026-03-23');

  const filtered = useMemo(() =>
    batches.filter(b => {
      const med = medicines.find(m => m.id === b.medicineId);
      const matchSearch = !search || med?.brandName.toLowerCase().includes(search.toLowerCase()) || b.batchNumber.toLowerCase().includes(search.toLowerCase());
      const matchBranch = !branchFilter || b.branchId === Number(branchFilter);
      const matchMed = !medFilter || b.medicineId === Number(medFilter);

      const exp = new Date(b.expiryDate);
      const ninetyDays = new Date(today);
      ninetyDays.setDate(ninetyDays.getDate() + 90);

      let matchStatus = true;
      if (statusFilter === 'Active') matchStatus = exp > ninetyDays;
      if (statusFilter === 'Expiring') matchStatus = exp > today && exp <= ninetyDays;
      if (statusFilter === 'Expired') matchStatus = exp <= today;

      return matchSearch && matchBranch && matchMed && matchStatus;
    }), [search, branchFilter, medFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getExpiryClass = (date) => {
    const exp = new Date(date);
    const ninetyDays = new Date(today);
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    if (exp <= today) return 'badge-danger';
    if (exp <= ninetyDays) return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Batches</h1>
          <p className="page-header-subtitle">{batches.length} batches total</p>
        </div>
        {hasPermission('CreateBatches') && <Link to="/dashboard/batches/new" className="btn btn-primary"><Plus size={18} /> Add Batch</Link>}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search by batch or medicine..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}>
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="filter-select" value={medFilter} onChange={e => { setMedFilter(e.target.value); setPage(1); }}>
          <option value="">All Medicines</option>
          {medicines.map(m => <option key={m.id} value={m.id}>{m.brandName}</option>)}
        </select>
        <div className="filter-tabs">
          {['All', 'Active', 'Expiring', 'Expired'].map(s => (
            <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Remaining</th>
              <th>Purchase</th>
              <th>Selling</th>
              <th>Expiry Date</th>
              <th>Branch</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-muted" style={{ padding: 40 }}>No batches found</td></tr>
            ) : paginated.map(b => {
              const med = medicines.find(m => m.id === b.medicineId);
              const branch = branches.find(br => br.id === b.branchId);
              const supplier = suppliers.find(s => s.id === b.supplierId);
              return (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.batchNumber}</td>
                  <td>{med?.brandName}</td>
                  <td>{b.quantity}</td>
                  <td>
                    <span className={`badge ${b.remainingQuantity < 10 ? 'badge-danger' : 'badge-gray'}`}>
                      {b.remainingQuantity}
                    </span>
                  </td>
                  <td>RWF {b.purchasePrice.toLocaleString()}</td>
                  <td>RWF {b.sellingPrice.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getExpiryClass(b.expiryDate)}`}>
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>{branch?.name?.split(' ')[0]}</td>
                  <td>{supplier?.name?.split(' ')[0]}</td>
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
