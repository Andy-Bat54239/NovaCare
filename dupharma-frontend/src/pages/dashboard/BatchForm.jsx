import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicines } from '../../data/medicines';
import { branches } from '../../data/branches';
import { suppliers } from '../../data/suppliers';
import { ArrowLeft, Save } from 'lucide-react';

export default function BatchForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    medicineId: '', batchNumber: '', quantity: '', purchasePrice: '',
    sellingPrice: '', manufacturingDate: '', expiryDate: '', supplierId: '', branchId: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving batch:', form);
    alert('Batch created successfully!');
    navigate('/dashboard/batches');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Add New Batch</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard/batches')}><ArrowLeft size={18} /> Back</button>
      </div>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Medicine</label>
                <select className="form-select" required value={form.medicineId} onChange={e => setForm({ ...form, medicineId: e.target.value })}>
                  <option value="">Select medicine...</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.brandName} ({m.genericName})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Batch Number</label>
                <input className="form-input" required placeholder="BN-2026-XXX" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price ($)</label>
                <input className="form-input" type="number" step="0.01" required value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price ($)</label>
                <input className="form-input" type="number" step="0.01" required value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Manufacturing Date</label>
                <input className="form-input" type="date" required value={form.manufacturingDate} onChange={e => setForm({ ...form, manufacturingDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input className="form-input" type="date" required value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-select" required value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <select className="form-select" required value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">Select branch...</option>
                  {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Create Batch</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/batches')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
