import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicines } from '../../data/medicines';
import { ArrowLeft, Save } from 'lucide-react';

export default function MedicineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    brandName: '', genericName: '', strength: '', form: 'Tablet',
    category: 'Antibiotics', price: '', requiresPrescription: false, description: '',
  });

  useEffect(() => {
    if (isEdit) {
      const med = medicines.find(m => m.id === Number(id));
      if (med) setForm({ ...med, price: String(med.price) });
    }
  }, [id, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving medicine:', form);
    alert(`Medicine ${isEdit ? 'updated' : 'created'} successfully!`);
    navigate('/dashboard/medicines');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Medicine' : 'Add New Medicine'}</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard/medicines')}><ArrowLeft size={18} /> Back</button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand Name</label>
                <input className="form-input" required value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Generic Name</label>
                <input className="form-input" required value={form.genericName} onChange={e => setForm({ ...form, genericName: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Strength</label>
                <input className="form-input" required value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Form</label>
                <select className="form-select" value={form.form} onChange={e => setForm({ ...form, form: e.target.value })}>
                  {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {['Antibiotics', 'Pain Relief', 'Cardiovascular', 'Diabetes', 'Vitamins', 'Respiratory', 'Gastrointestinal', 'Dermatology'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (RWF)</label>
                <input className="form-input" type="number" step="1" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-checkbox-label">
                <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm({ ...form, requiresPrescription: e.target.checked })} />
                Requires Prescription
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary"><Save size={18} /> {isEdit ? 'Update' : 'Create'} Medicine</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/medicines')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
