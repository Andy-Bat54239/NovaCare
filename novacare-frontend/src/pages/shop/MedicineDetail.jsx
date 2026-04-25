import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getMedicine, getMedicines } from "../../api/medicines";
import { getBatches } from "../../api/batches";
import { getBranches } from "../../api/branches";
import { useCart } from "../../context/CartContext";
import MedicineImage from "../../components/MedicineImage";
import {
  ShoppingCart,
  AlertTriangle,
  ArrowLeft,
  Upload,
  FileImage,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";

export default function MedicineDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [medicine, setMedicine] = useState(null);
  const [related, setRelated] = useState([]);
  const [stockByBranch, setStockByBranch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [med, batches, branches, allMeds] = await Promise.all([
          getMedicine(id),
          getBatches({ medicineId: id }),
          getBranches(),
          getMedicines(),
        ]);
        setMedicine(med);

        const activeBranches = (Array.isArray(branches) ? branches : []).filter(
          (b) => b.isActive,
        );
        const today = new Date();
        setStockByBranch(
          activeBranches.map((b) => ({
            ...b,
            stock: (Array.isArray(batches) ? batches : [])
              .filter(
                (bt) => bt.branchId === b.id && new Date(bt.expiryDate) > today,
              )
              .reduce((s, bt) => s + bt.remainingQuantity, 0),
          })),
        );

        setRelated(
          (Array.isArray(allMeds) ? allMeds : [])
            .filter((m) => m.category === med.category && m.id !== med.id)
            .slice(0, 4),
        );
      } catch (err) {
        console.error("Failed to load medicine:", err);
        setMedicine(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrescriptionFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Please upload a JPG, PNG, or PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }
    setPrescription(file);
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => setPrescriptionPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview("pdf");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handlePrescriptionFile(e.dataTransfer.files[0]);
  };
  const removePrescription = () => {
    setPrescription(null);
    setPrescriptionPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddToCart = (withPrescription = false) => {
    addToCart(medicine, qty, withPrescription ? prescription : null);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div
        className="shop-section"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
          flexDirection: "column",
          gap: 16,
        }}
      >
        <RefreshCw
          size={32}
          color="var(--primary)"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p style={{ color: "var(--text-muted)" }}>
          Loading medicine details...
        </p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="shop-section">
        <div className="empty-state">
          <h3>Medicine not found</h3>
          <Link to="/shop/medicines" className="btn btn-primary mt-3">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const totalStock = stockByBranch.reduce((s, b) => s + b.stock, 0);

  return (
    <div className="medicine-detail">
      <Link
        to="/shop/medicines"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
          color: "var(--text-secondary)",
        }}
      >
        <ArrowLeft size={18} /> Back to Medicines
      </Link>

      <div className="medicine-detail-grid">
        <MedicineImage medicine={medicine} size="lg" />
        <div className="medicine-detail-info">
          <h1>{medicine.brandName}</h1>
          <div className="generic-name">{medicine.genericName}</div>
          <div className="medicine-detail-price">
            RWF {Math.round(medicine.price).toLocaleString()}
          </div>

          <div className="medicine-detail-meta">
            <div className="medicine-detail-meta-item">
              <label>Strength</label>
              <p>{medicine.strength}</p>
            </div>
            <div className="medicine-detail-meta-item">
              <label>Form</label>
              <p>{medicine.form}</p>
            </div>
            <div className="medicine-detail-meta-item">
              <label>Category</label>
              <p>{medicine.category}</p>
            </div>
            <div className="medicine-detail-meta-item">
              <label>Stock</label>
              <p>{totalStock} units</p>
            </div>
          </div>

          {medicine.requiresPrescription ? (
            <div>
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                <AlertTriangle size={16} /> This medicine requires a valid
                prescription. Please upload it below before adding to cart.
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Upload Prescription
                </label>

                {!prescription ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border-color)"}`,
                      borderRadius: 12,
                      padding: "32px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: dragOver
                        ? "var(--primary-50, #f0fdfa)"
                        : "var(--bg-secondary)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Upload
                      size={32}
                      style={{ color: "var(--primary)", marginBottom: 10 }}
                    />
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      Click or drag & drop your prescription
                    </p>
                    <p
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Accepted: JPG, PNG, PDF — Max 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) =>
                        handlePrescriptionFile(e.target.files[0])
                      }
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      border: "2px solid var(--success)",
                      borderRadius: 12,
                      padding: 16,
                      background: "var(--success-bg)",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    {prescriptionPreview && prescriptionPreview !== "pdf" ? (
                      <img
                        src={prescriptionPreview}
                        alt="Preview"
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid var(--border-color)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          background: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileImage size={28} color="white" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <CheckCircle size={16} color="var(--success)" />
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--success)",
                            fontSize: "0.9rem",
                          }}
                        >
                          Prescription uploaded
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                        }}
                      >
                        {prescription.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          margin: 0,
                        }}
                      >
                        {(prescription.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={removePrescription}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--danger)",
                        padding: 4,
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="medicine-detail-actions">
                <div className="quantity-selector">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    -
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)}>
                    +
                  </button>
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleAddToCart(true)}
                  disabled={totalStock === 0 || !prescription}
                  title={
                    !prescription ? "Please upload a prescription first" : ""
                  }
                >
                  <ShoppingCart size={20} /> {added ? "Added!" : "Add to Cart"}
                </button>
              </div>
              {!prescription && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--danger)",
                    marginTop: 8,
                  }}
                >
                  * Upload your prescription to enable the Add to Cart button.
                </p>
              )}
            </div>
          ) : (
            <div className="medicine-detail-actions">
              <div className="quantity-selector">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  -
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)}>
                  +
                </button>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleAddToCart(false)}
                disabled={totalStock === 0}
              >
                <ShoppingCart size={20} /> {added ? "Added!" : "Add to Cart"}
              </button>
            </div>
          )}

          <p
            style={{
              marginTop: 20,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            {medicine.description}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 40 }}>
        <div className="card-header">
          <h3>Availability by Branch</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Address</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {stockByBranch.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td className="text-muted">{b.address}</td>
                  <td>
                    <span
                      className={`badge ${b.stock > 0 ? "badge-success" : "badge-danger"}`}
                    >
                      {b.stock > 0 ? `${b.stock} in stock` : "Out of stock"}
                    </span>
                  </td>
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
            {related.map((m) => (
              <Link
                to={`/shop/medicines/${m.id}`}
                key={m.id}
                className="product-card"
              >
                <MedicineImage medicine={m} size="md" />
                <div className="product-card-body">
                  <h3>{m.brandName}</h3>
                  <div className="generic-name">{m.genericName}</div>
                  <div className="product-card-footer">
                    <span className="product-price">
                      RWF {Math.round(m.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
