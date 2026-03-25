import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { medicines } from '../../data/medicines';
import { batches } from '../../data/batches';
import { Plus, Search, Edit, Eye } from 'lucide-react';

export default function Medicines() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const categories = [...new Set(medicines.map(m => m.category))];
  const forms = [...new Set(medicines.map(m => m.form))];

  const enriched = useMemo(() =>
    medicines.map(m => ({
      ...m,
      totalStock: batches.filter(b => b.medicineId === m.id).reduce((sum, b) => sum + b.remainingQuantity, 0),
    })), []);

  const filtered = useMemo(() =>
    enriched.filter(m => {
      const matchSearch = m.brandName.toLowerCase().includes(search.toLowerCase()) || m.genericName.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || m.category === categoryFilter;
      const matchForm = !formFilter || m.form === formFilter;
      return matchSearch && matchCat && matchForm;
    }), [search, categoryFilter, formFilter, enriched]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Medicines</h1>
          <p className="page-header-subtitle">{medicines.length} medicines in inventory</p>
        </div>
        {hasPermission('CreateMedicines') && <Link to="/dashboard/medicines/new" className="btn btn-primary"><Plus size={18} /> Add Medicine</Link>}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search medicines..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={formFilter} onChange={e => { setFormFilter(e.target.value); setPage(1); }}>
          <option value="">All Forms</option>
          {forms.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand Name</th>
              <th>Generic Name</th>
              <th>Strength</th>
              <th>Form</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rx</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-muted" style={{ padding: 40 }}>No medicines found</td></tr>
            ) : paginated.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.brandName}</td>
                <td className="text-muted">{m.genericName}</td>
                <td>{m.strength}</td>
                <td><span className="badge badge-gray">{m.form}</span></td>
                <td>{m.category}</td>
                <td style={{ fontWeight: 600 }}>RWF {m.price.toLocaleString()}</td>
                <td>
                  <span className={`badge ${m.totalStock < 10 ? 'badge-danger' : m.totalStock < 50 ? 'badge-warning' : 'badge-success'}`}>
                    {m.totalStock}
                  </span>
                </td>
                <td>{m.requiresPrescription ? <span className="badge badge-info">Rx</span> : <span className="badge badge-gray">OTC</span>}</td>
                <td>
                  <div className="table-actions">
                    {hasPermission('EditMedicines') && <Link to={`/dashboard/medicines/${m.id}/edit`} className="btn-icon" title="Edit"><Edit size={16} /></Link>}
                    <Link to={`/dashboard/batches?medicine=${m.id}`} className="btn-icon" title="View Batches"><Eye size={16} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
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
