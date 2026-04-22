import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMedicine, createMedicine, updateMedicine, uploadMedicineImage } from '../../api/medicines';
import { ArrowLeft, Save, Upload, X, RefreshCw } from 'lucide-react';

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Powder'];
const CATEGORIES = ['Antibiotics', 'Pain Relief', 'Cardiovascular', 'Diabetes', 'Vitamins', 'Respiratory', 'Gastrointestinal', 'Dermatology', 'Mental Health', 'Hormones'];

// Resolve a stored image path to a preview URL.
// Uploaded files live under /uploads/ (served by the API); seed images live in Vite public/.
const resolvePreview = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return `http://localhost:5232${path}`;
  return path;
};

export default function MedicineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    brandName: '', genericName: '', strength: '', form: 'Tablet',
    category: 'Antibiotics', price: '', requiresPrescription: false, description: '', imagePath: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getMedicine(id)
        .then(med => setForm({ ...med, price: String(med.price) }))
        .catch(() => setError('Failed to load medicine.'));
    }
  }, [id, isEdit]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError('');

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WEBP file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const { path } = await uploadMedicineImage(file);
      setForm((prev) => ({ ...prev, imagePath: path }));
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, imagePath: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (isEdit) {
        await updateMedicine(id, { ...payload, id: Number(id) });
      } else {
        await createMedicine(payload);
      }
      navigate('/dashboard/medicines');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medicine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>{isEdit ? 'Edit Medicine' : 'Add New Medicine'}</h1></div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard/medicines')}><ArrowLeft size={18} /> Back</button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>
            )}
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
                <input className="form-input" required placeholder="e.g. 500mg" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Form</label>
                <select className="form-select" value={form.form} onChange={e => setForm({ ...form, form: e.target.value })}>
                  {FORMS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (RWF)</label>
                <input className="form-input" type="number" step="100" min="0" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Image (optional)</label>
              {uploadError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: '0.85rem' }}>{uploadError}</div>
              )}

              {!form.imagePath ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: 12,
                    padding: '28px 24px',
                    textAlign: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: dragOver ? 'var(--primary-50)' : 'var(--bg-secondary, #f8fafc)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={28} style={{ color: 'var(--primary)', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
                      <p style={{ fontWeight: 600 }}>Uploading…</p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>Click or drag & drop an image</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG, PNG, or WEBP — max 5MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--bg-card)',
                }}>
                  <img
                    src={resolvePreview(form.imagePath)}
                    alt="Preview"
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)', background: '#f8fafc' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>Image uploaded</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{form.imagePath}</p>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    Replace
                  </button>
                  <button type="button" onClick={removeImage} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 6 }} title="Remove">
                    <X size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-checkbox-label">
                <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm({ ...form, requiresPrescription: e.target.checked })} />
                Requires Prescription
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={4} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                <Save size={18} /> {saving ? 'Saving...' : isEdit ? 'Update Medicine' : 'Create Medicine'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/medicines')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
