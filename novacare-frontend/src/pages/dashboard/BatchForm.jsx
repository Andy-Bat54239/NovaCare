import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMedicines } from "../../api/medicines";
import { getBranches } from "../../api/branches";
import { createBatch } from "../../api/batches";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Save } from "lucide-react";

export default function BatchForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    medicineId: "",
    branchId: String(currentUser?.branchId || ""),
    initialQuantity: "",
    costPrice: "",
    manufacturingDate: "",
    expiryDate: "",
    supplier: "",
  });

  useEffect(() => {
    Promise.all([getMedicines(), getBranches()])
      .then(([meds, brs]) => {
        setMedicines(Array.isArray(meds) ? meds : []);
        setBranches((Array.isArray(brs) ? brs : []).filter((b) => b.isActive));
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createBatch({
        medicineId: Number(form.medicineId),
        branchId: Number(form.branchId),
        // batchNumber is omitted — the server auto-generates it (BCH-YYYYMM-XXXXXX)
        initialQuantity: Number(form.initialQuantity),
        remainingQuantity: Number(form.initialQuantity),
        costPrice: Number(form.costPrice),
        manufacturingDate: new Date(form.manufacturingDate).toISOString(),
        expiryDate: new Date(form.expiryDate).toISOString(),
        supplier: form.supplier,
      });
      navigate("/dashboard/batches");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create batch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Add New Batch</h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/dashboard/batches")}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Medicine</label>
                <select
                  className="form-select"
                  required
                  value={form.medicineId}
                  onChange={(e) =>
                    setForm({ ...form, medicineId: e.target.value })
                  }
                >
                  <option value="">Select medicine...</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brandName} ({m.genericName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <select
                  className="form-select"
                  required
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({ ...form, branchId: e.target.value })
                  }
                >
                  <option value="">Select branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                className="form-input"
                placeholder="e.g. Cipla Ltd"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  required
                  value={form.initialQuantity}
                  onChange={(e) =>
                    setForm({ ...form, initialQuantity: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price (RWF)</label>
                <input
                  className="form-input"
                  type="number"
                  step="100"
                  min="0"
                  required
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Manufacturing Date</label>
                <input
                  className="form-input"
                  type="date"
                  required
                  value={form.manufacturingDate}
                  onChange={(e) =>
                    setForm({ ...form, manufacturingDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  className="form-input"
                  type="date"
                  required
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={18} /> {saving ? "Creating..." : "Create Batch"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/dashboard/batches")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
