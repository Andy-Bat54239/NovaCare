import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { branches } from '../../data/branches';
import { CheckCircle, Upload } from 'lucide-react';

export default function PlaceOrder() {
  const { cartItems, getTotal, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', email: '', phone: '', branchId: '1' });
  const [submitted, setSubmitted] = useState(false);
  const total = getTotal();
  const hasRx = cartItems.some(i => i.requiresPrescription);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Order placed:', { ...form, items: cartItems, total });
    clearCart();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="shop-section">
        <div className="success-page">
          <div className="success-icon"><CheckCircle size={40} /></div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order #ORD-{Date.now().toString().slice(-6)} has been submitted and is awaiting approval.</p>
          <p className="text-muted">You will receive a confirmation email shortly.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <Link to="/shop" className="btn btn-primary">Back to Home</Link>
            <Link to="/shop/medicines" className="btn btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="shop-section">
        <div className="empty-state"><h3>No items to order</h3><Link to="/shop/medicines" className="btn btn-primary mt-3">Browse Medicines</Link></div>
      </div>
    );
  }

  return (
    <div className="shop-section" style={{ paddingTop: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Place Your Order</h2>
      <div className="order-layout">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Pickup Branch</label>
                <select className="form-select" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                  {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {hasRx && (
                <div className="form-group">
                  <label className="form-label">Upload Prescription</label>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius)', padding: 32, textAlign: 'center', cursor: 'pointer' }}>
                    <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                    <p className="text-muted">Click or drag to upload prescription image</p>
                    <input type="file" accept="image/*" style={{ display: 'none' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'none' }}><input name="honeypot" tabIndex={-1} autoComplete="off" /></div>
              <button type="submit" className="btn btn-primary btn-lg w-full" style={{ width: '100%' }}>Place Order — RWF {total.toLocaleString()}</button>
            </form>
          </div>
        </div>

        <div className="order-summary-card">
          <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
          {cartItems.map(item => (
            <div key={item.medicineId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
              <div><div style={{ fontWeight: 600 }}>{item.name}</div><div className="text-muted">Qty: {item.quantity}</div></div>
              <div style={{ fontWeight: 600 }}>RWF {(item.price * item.quantity).toLocaleString()}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, fontWeight: 700, fontSize: '1.1rem' }}>
            <span>Total</span><span style={{ color: 'var(--primary)' }}>RWF {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
