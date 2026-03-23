import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { medicines } from '../../data/medicines';
import { batches } from '../../data/batches';
import { branches } from '../../data/branches';
import { useCart } from '../../context/CartContext';
import MedicineImage from '../../components/MedicineImage';
import { ShoppingCart, AlertTriangle, ArrowLeft, Minus, Plus } from 'lucide-react';

export default function MedicineDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const medicine = medicines.find(m => m.id === Number(id));
  if (!medicine) return <div className="shop-section"><div className="empty-state"><h3>Medicine not found</h3><Link to="/shop/medicines" className="btn btn-primary mt-3">Back to Catalog</Link></div></div>;

  const stockByBranch = branches.filter(b => b.isActive).map(b => ({
    ...b,
    stock: batches.filter(bt => bt.medicineId === medicine.id && bt.branchId === b.id && new Date(bt.expiryDate) > new Date('2026-03-23')).reduce((s, bt) => s + bt.remainingQuantity, 0),
  }));

  const totalStock = stockByBranch.reduce((s, b) => s + b.stock, 0);
  const related = medicines.filter(m => m.category === medicine.category && m.id !== medicine.id).slice(0, 4);

  const handleAdd = () => {
    addToCart(medicine, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="medicine-detail">
      <Link to="/shop/medicines" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-secondary)' }}><ArrowLeft size={18} /> Back to Medicines</Link>

      <div className="medicine-detail-grid">
        <MedicineImage medicine={medicine} size="lg" />
        <div className="medicine-detail-info">
          <h1>{medicine.brandName}</h1>
          <div className="generic-name">{medicine.genericName}</div>
          <div className="medicine-detail-price">RWF {medicine.price.toLocaleString()}</div>

          <div className="medicine-detail-meta">
            <div className="medicine-detail-meta-item"><label>Strength</label><p>{medicine.strength}</p></div>
            <div className="medicine-detail-meta-item"><label>Form</label><p>{medicine.form}</p></div>
            <div className="medicine-detail-meta-item"><label>Category</label><p>{medicine.category}</p></div>
            <div className="medicine-detail-meta-item"><label>Stock</label><p>{totalStock} units</p></div>
          </div>

          {medicine.requiresPrescription ? (
            <div className="alert alert-warning"><AlertTriangle size={16} /> This medicine requires a valid prescription. Please upload it when placing your order.</div>
          ) : (
            <div className="medicine-detail-actions">
              <div className="quantity-selector">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAdd} disabled={totalStock === 0}>
                <ShoppingCart size={20} /> {added ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          )}

          <p style={{ marginTop: 20, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{medicine.description}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 40 }}>
        <div className="card-header"><h3>Availability by Branch</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Branch</th><th>Address</th><th>Stock</th></tr></thead>
            <tbody>
              {stockByBranch.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td className="text-muted">{b.address}</td>
                  <td><span className={`badge ${b.stock > 0 ? 'badge-success' : 'badge-danger'}`}>{b.stock > 0 ? `${b.stock} in stock` : 'Out of stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>Related Medicines</h2>
          <div className="product-grid">
            {related.map(m => (
              <Link to={`/shop/medicines/${m.id}`} key={m.id} className="product-card">
                <MedicineImage medicine={m} size="md" />
                <div className="product-card-body">
                  <h3>{m.brandName}</h3>
                  <div className="generic-name">{m.genericName}</div>
                  <div className="product-card-footer"><span className="product-price">RWF {m.price.toLocaleString()}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
