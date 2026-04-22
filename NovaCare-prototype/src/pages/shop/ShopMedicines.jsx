import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { medicines } from '../../data/medicines';
import { batches } from '../../data/batches';
import MedicineImage from '../../components/MedicineImage';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function ShopMedicines() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [formFilter, setFormFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [rxFilter, setRxFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const categories = [...new Set(medicines.map(m => m.category))];
  const forms = [...new Set(medicines.map(m => m.form))];

  const filtered = useMemo(() => {
    let result = medicines.filter(m => {
      const matchSearch = !search || m.brandName.toLowerCase().includes(search.toLowerCase()) || m.genericName.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || m.category === categoryFilter;
      const matchForm = !formFilter || m.form === formFilter;
      const matchRx = !rxFilter || (rxFilter === 'otc' ? !m.requiresPrescription : m.requiresPrescription);
      return matchSearch && matchCat && matchForm && matchRx;
    });

    switch (sortBy) {
      case 'name-asc': result.sort((a, b) => a.brandName.localeCompare(b.brandName)); break;
      case 'name-desc': result.sort((a, b) => b.brandName.localeCompare(a.brandName)); break;
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
    }
    return result;
  }, [search, categoryFilter, formFilter, sortBy, rxFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="shop-section" style={{ paddingTop: 32 }}>
      <div className="shop-section-header" style={{ marginBottom: 24 }}>
        <h2>Our Medicines</h2>
        <p>{filtered.length} products available</p>
      </div>

      <div className="filters-bar" style={{ justifyContent: 'center', marginBottom: 32 }}>
        <div className="search-input-wrapper" style={{ maxWidth: 500 }}>
          <Search />
          <input className="form-input" placeholder="Search medicines..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="filters-bar" style={{ justifyContent: 'center' }}>
        <select className="filter-select" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={formFilter} onChange={e => { setFormFilter(e.target.value); setPage(1); }}>
          <option value="">All Forms</option>
          {forms.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="filter-select" value={rxFilter} onChange={e => { setRxFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="otc">Over the Counter</option>
          <option value="rx">Prescription Only</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="product-grid" style={{ marginTop: 24 }}>
        {paginated.map(m => (
          <Link to={`/shop/medicines/${m.id}`} key={m.id} className="product-card">
            <MedicineImage medicine={m} size="md" />
            <div className="product-card-body">
              <h3>{m.brandName}</h3>
              <div className="generic-name">{m.genericName}</div>
              <div className="strength-form">{m.strength} · {m.form}</div>
              <div className="product-card-footer">
                <span className="product-price">RWF {m.price.toLocaleString()}</span>
                <span className="badge badge-gray">{m.category}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {paginated.length === 0 && (
        <div className="empty-state"><h3>No medicines found</h3><p>Try adjusting your filters or search terms</p></div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ justifyContent: 'center' }}>
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
