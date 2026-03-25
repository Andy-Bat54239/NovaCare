import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicines } from '../../data/medicines';
import { batches } from '../../data/batches';
import { customers } from '../../data/customers';
import { branches } from '../../data/branches';
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';

export default function NewSale() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [branchId, setBranchId] = useState('1');
  const [success, setSuccess] = useState(false);

  const medsWithStock = useMemo(() =>
    medicines.map(m => ({
      ...m,
      stock: batches.filter(b => b.medicineId === m.id && b.branchId === Number(branchId)).reduce((s, b) => s + b.remainingQuantity, 0),
    })).filter(m => m.stock > 0), [branchId]);

  const filtered = medsWithStock.filter(m =>
    m.brandName.toLowerCase().includes(search.toLowerCase()) || m.genericName.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (med) => {
    setCart(prev => {
      const exists = prev.find(i => i.medicineId === med.id);
      if (exists) return prev.map(i => i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { medicineId: med.id, name: med.brandName, unitPrice: med.price, quantity: 1 }];
    });
  };

  const updateQty = (medId, delta) => {
    setCart(prev => prev.map(i => i.medicineId === medId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (medId) => setCart(prev => prev.filter(i => i.medicineId !== medId));
  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const completeSale = () => {
    console.log('Sale completed:', { cart, customerId, paymentMethod, branchId, total });
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="success-page">
        <div className="success-icon"><CheckCircle size={40} /></div>
        <h1>Sale Completed!</h1>
        <p>Invoice INV{new Date().toISOString().slice(0, 10).replace(/-/g, '')}XXXX has been created successfully.</p>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary)' }}>Total: RWF {total.toLocaleString()}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => { setCart([]); setSuccess(false); }}>New Sale</button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard/sales')}>View Sales</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Sale (POS)</h1>
        <select className="filter-select" value={branchId} onChange={e => setBranchId(e.target.value)}>
          {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="pos-layout">
        <div className="pos-products">
          <div className="search-input-wrapper" style={{ marginBottom: 16 }}>
            <Search />
            <input className="form-input" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="medicine-mini-grid">
            {filtered.map(m => (
              <div key={m.id} className="medicine-mini-card" onClick={() => addToCart(m)}>
                <h4>{m.brandName}</h4>
                <div className="generic">{m.genericName} - {m.strength}</div>
                <div className="mini-card-footer">
                  <span className="price">RWF {m.price.toLocaleString()}</span>
                  <span className="stock">{m.stock} in stock</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={20} /> Cart ({cart.length})</h3>
          </div>
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <ShoppingCart size={40} />
                <p>Click medicines to add</p>
              </div>
            ) : cart.map(item => (
              <div key={item.medicineId} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name">{item.name}</div>
                  <div className="pos-cart-item-price">RWF {item.unitPrice.toLocaleString()} each</div>
                </div>
                <div className="pos-cart-qty">
                  <button onClick={() => updateQty(item.medicineId, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.medicineId, 1)}><Plus size={14} /></button>
                </div>
                <span style={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>RWF {(item.unitPrice * item.quantity).toLocaleString()}</span>
                <button className="btn-ghost" onClick={() => removeItem(item.medicineId)} style={{ padding: 4 }}><Trash2 size={16} color="var(--danger)" /></button>
              </div>
            ))}
          </div>
          <div className="pos-cart-footer">
            <div style={{ marginBottom: 12 }}>
              <select className="filter-select w-full" style={{ width: '100%', marginBottom: 8 }} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
              <select className="filter-select w-full" style={{ width: '100%' }} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option>Cash</option>
                <option>Card</option>
                <option>Mobile</option>
              </select>
            </div>
            <div className="pos-cart-total">
              <span>Total</span>
              <span>RWF {total.toLocaleString()}</span>
            </div>
            <button className="btn btn-primary w-full" style={{ width: '100%' }} disabled={cart.length === 0} onClick={completeSale}>Complete Sale</button>
          </div>
        </div>
      </div>
    </div>
  );
}
