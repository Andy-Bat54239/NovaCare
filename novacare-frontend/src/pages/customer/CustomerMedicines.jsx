import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMedicines } from '../../api/medicines';
import { getBatches } from '../../api/batches';
import { getBranches } from '../../api/branches';
import { useCart } from '../../context/CartContext';
import MedicineImage from '../../components/MedicineImage';
import { Search, Package, ShoppingCart, Plus, Minus, FileImage, X, Upload } from 'lucide-react';

export default function CustomerMedicines() {
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, getItemCount, getTotal } = useCart();
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  // qty per medicine before adding to cart
  const [qty, setQty] = useState({});
  // Prescription modal state
  const [rxModal, setRxModal] = useState(null); // { medicine, qty }
  const [rxFile, setRxFile] = useState(null);
  const [rxPreview, setRxPreview] = useState(null);

  useEffect(() => {
    Promise.all([getMedicines(), getBatches(), getBranches()])
      .then(([meds, batchData, branchData]) => {
        setMedicines(meds || []);
        setBatches(batchData || []);
        setBranches((branchData || []).filter(b => b.isActive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStockForMedicine = (medicineId) => {
    const today = new Date();
    return branches.map(branch => {
      const stock = batches
        .filter(b => b.medicineId === medicineId && b.branchId === branch.id && new Date(b.expiryDate) > today)
        .reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);
      return { branch, stock };
    });
  };

  const getQty = (id) => qty[id] || 1;
  const setMedQty = (id, val) => setQty(prev => ({ ...prev, [id]: Math.max(1, val) }));

  const openRxModal = (medicine) => {
    setRxModal({ medicine, qty: getQty(medicine.id) });
    setRxFile(null);
    setRxPreview(null);
  };

  const handleRxFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRxFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setRxPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setRxPreview(null); // PDF — no image preview
    }
  };

  const confirmRxAdd = () => {
    if (!rxFile || !rxModal) return;
    addToCart(rxModal.medicine, rxModal.qty, rxFile);
    setRxModal(null);
    setRxFile(null);
    setRxPreview(null);
  };

  const cartCount = (medicineId) => {
    const item = cartItems.find(i => i.medicineId === medicineId);
    return item?.quantity || 0;
  };

  const filtered = medicines.filter(m =>
    m.brandName?.toLowerCase().includes(search.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading medicines...</p>
    </div>
  );

  const totalItems = getItemCount();

  return (
    <div style={{ paddingBottom: totalItems > 0 ? 90 : 0 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>Medicine Availability</h2>
        <p style={{ color: 'var(--text-muted)' }}>Browse stock across all NovaCare branches and add to your order</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          placeholder="Search by name, generic name, or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 44 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(med => {
          const stockPerBranch = getStockForMedicine(med.id);
          const totalStock = stockPerBranch.reduce((s, b) => s + b.stock, 0);
          const inCart = cartCount(med.id);

          return (
            <div key={med.id} style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: 14, padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Medicine image thumbnail */}
                <div style={{ width: 88, flexShrink: 0 }}>
                  <MedicineImage medicine={med} size="sm" />
                </div>

                {/* Card body */}
                <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{med.brandName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    {med.genericName} · {med.strength} · {med.form}
                  </p>
                  <p style={{ margin: '6px 0 0' }}>
                    <span className="badge badge-gray">{med.category}</span>
                    {med.requiresPrescription && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Prescription Required</span>}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    RWF {Math.round(med.price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: totalStock > 0 ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: 2 }}>
                    {totalStock > 0 ? `${totalStock} units available` : 'Out of stock'}
                  </div>
                </div>
              </div>

              {/* Branch stock */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {stockPerBranch.map(({ branch, stock }) => (
                  <div key={branch.id} style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: stock > 0 ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${stock > 0 ? '#bbf7d0' : '#fecaca'}`,
                    fontSize: '0.82rem',
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{branch.name}</div>
                    <div style={{ color: stock > 10 ? '#16a34a' : stock > 0 ? '#d97706' : '#dc2626', fontWeight: 600 }}>
                      {stock > 0 ? `${stock} in stock` : 'Not available'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add to cart controls */}
              {totalStock > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {inCart > 0 ? (
                    /* Already in cart — show inline stepper + prescription indicator */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => updateQuantity(med.id, inCart - 1)}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 24, textAlign: 'center' }}>{inCart}</span>
                      <button onClick={() => updateQuantity(med.id, inCart + 1)}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--primary)', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} />
                      </button>
                      <span style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>✓ In cart</span>
                      {med.requiresPrescription && (() => {
                        const cartItem = cartItems.find(i => i.medicineId === med.id);
                        return cartItem?.prescriptionDataUrl
                          ? <span style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}><FileImage size={13} /> Rx attached</span>
                          : <span style={{ fontSize: '0.78rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><FileImage size={13} /> No prescription</span>;
                      })()}
                    </div>
                  ) : (
                    /* Not in cart — qty picker + add button */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => setMedQty(med.id, getQty(med.id) - 1)}
                          style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={13} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{getQty(med.id)}</span>
                        <button onClick={() => setMedQty(med.id, getQty(med.id) + 1)}
                          style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => med.requiresPrescription ? openRxModal(med) : addToCart(med, getQty(med.id))}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                        {med.requiresPrescription ? <><FileImage size={15} /> Add with Rx</> : <><ShoppingCart size={15} /> Add to Cart</>}
                      </button>
                    </div>
                  )}
                </div>
              )}
                </div> {/* end card body */}
              </div> {/* end image + body row */}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No medicines found matching your search.</p>
          </div>
        )}
      </div>

      {/* Prescription upload modal */}
      {rxModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: '28px 28px 24px', width: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Prescription Required</h3>
              <button onClick={() => setRxModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '0.83rem', color: '#64748b' }}>
              <strong>{rxModal.medicine.brandName}</strong> requires a valid prescription. Please upload a clear photo or scan of your prescription before adding to cart.
            </p>

            {/* File drop area */}
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '24px 16px', borderRadius: 12, cursor: 'pointer',
              border: `2px dashed ${rxFile ? '#22c55e' : '#cbd5e1'}`,
              background: rxFile ? '#f0fdf4' : '#f8fafc',
              marginBottom: 16, transition: 'all 0.15s',
            }}>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={handleRxFileChange} />
              {rxPreview ? (
                <img src={rxPreview} alt="prescription preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
              ) : (
                <>
                  <Upload size={28} color={rxFile ? '#22c55e' : '#94a3b8'} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                    {rxFile ? rxFile.name : 'Tap to upload · JPG, PNG or PDF · Max 5 MB'}
                  </span>
                </>
              )}
              {rxFile && !rxPreview && (
                <span style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>✓ {rxFile.name}</span>
              )}
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRxModal(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f1f5f9', color: '#374151', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmRxAdd} disabled={!rxFile}
                style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: rxFile ? 'var(--primary)' : '#e2e8f0', color: rxFile ? 'white' : '#94a3b8', fontWeight: 700, fontSize: '0.9rem', cursor: rxFile ? 'pointer' : 'not-allowed' }}>
                <ShoppingCart size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating checkout bar */}
      {totalItems > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'var(--primary)', color: 'white',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCart size={20} />
            <span style={{ fontWeight: 700 }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span style={{ opacity: 0.8 }}>· RWF {Math.round(getTotal()).toLocaleString()}</span>
          </div>
          <button onClick={() => navigate('/customer/checkout')}
            style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}
