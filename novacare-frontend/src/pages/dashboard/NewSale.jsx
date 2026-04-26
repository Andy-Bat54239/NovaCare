import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMedicines } from "../../api/medicines";
import { getBatches } from "../../api/batches";
import { getCustomers } from "../../api/customers";
import { getBranches } from "../../api/branches";
import { createSale } from "../../api/sales";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

export default function NewSale() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [branchId, setBranchId] = useState(
    String(currentUser?.branchId || "1"),
  );
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [medsData, batchData, custData, branchData] = await Promise.all([
          getMedicines(),
          getBatches(),
          getCustomers(),
          getBranches(),
        ]);
        setMedicines(Array.isArray(medsData) ? medsData : []);
        setBatches(Array.isArray(batchData) ? batchData : []);
        setCustomers(Array.isArray(custData) ? custData : []);
        setBranches(
          (Array.isArray(branchData) ? branchData : []).filter(
            (b) => b.isActive,
          ),
        );
      } catch (err) {
        console.error("Failed to load sale data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const medsWithStock = useMemo(
    () =>
      medicines
        .map((m) => ({
          ...m,
          stock: batches
            .filter(
              (b) =>
                b.medicineId === m.id &&
                b.branchId === Number(branchId) &&
                b.remainingQuantity > 0 &&
                new Date(b.expiryDate) > new Date(),
            )
            .reduce((s, b) => s + b.remainingQuantity, 0),
        }))
        .filter((m) => m.stock > 0),
    [medicines, batches, branchId],
  );

  const filtered = medsWithStock.filter(
    (m) =>
      !search ||
      m.brandName.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()),
  );

  const addToCart = (med) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.medicineId === med.id);
      const maxQty = med.stock;
      if (exists) {
        return exists.quantity >= maxQty
          ? prev
          : prev.map((i) =>
              i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i,
            );
      }
      return [
        ...prev,
        {
          medicineId: med.id,
          name: med.brandName,
          unitPrice: med.price,
          quantity: 1,
          maxStock: maxQty,
        },
      ];
    });
  };

  const updateQty = (medId, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.medicineId === medId
          ? {
              ...i,
              quantity: Math.min(i.maxStock, Math.max(1, i.quantity + delta)),
            }
          : i,
      ),
    );
  };

  const removeItem = (medId) =>
    setCart((prev) => prev.filter((i) => i.medicineId !== medId));
  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const completeSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const saleData = {
        branchId: Number(branchId),
        userId: currentUser.id,
        customerId: customerId ? Number(customerId) : null,
        paymentMethod,
        paymentReference: paymentMethod !== "Cash" ? paymentReference : null,
        totalAmount: total,
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.unitPrice * i.quantity,
        })),
      };
      const created = await createSale(saleData);
      setSuccess(created);
      setCart([]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to complete sale. Check stock availability.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
          flexDirection: "column",
          gap: 16,
        }}
      >
        <RefreshCw
          size={32}
          color="var(--primary)"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Loading POS data...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-page">
        <div className="success-icon">
          <CheckCircle size={40} />
        </div>
        <h1>Sale Completed!</h1>
        <p>
          Invoice <strong>{success.invoiceNumber}</strong> has been created
          successfully.
        </p>
        <p
          style={{
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "var(--primary)",
          }}
        >
          Total: RWF {Math.round(total).toLocaleString()}
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 24,
          }}
        >
          <button className="btn btn-primary" onClick={() => setSuccess(null)}>
            New Sale
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard/sales")}
          >
            View Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Sale (POS)</h1>
        <select
          className="filter-select"
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setCart([]);
          }}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div className="pos-layout">
        <div className="pos-products">
          <div className="search-input-wrapper" style={{ marginBottom: 16 }}>
            <Search />
            <input
              className="form-input"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="medicine-mini-grid">
            {filtered.length === 0 ? (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: 40,
                  color: "var(--text-muted)",
                }}
              >
                No medicines in stock for this branch.
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className="medicine-mini-card"
                  onClick={() => addToCart(m)}
                >
                  <h4>{m.brandName}</h4>
                  <div className="generic">
                    {m.genericName} — {m.strength}
                  </div>
                  <div className="mini-card-footer">
                    <span className="price">
                      RWF {Math.round(m.price).toLocaleString()}
                    </span>
                    <span className="stock">{m.stock} in stock</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={20} /> Cart ({cart.length})
            </h3>
          </div>
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <ShoppingCart size={40} />
                <p>Click medicines to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.medicineId} className="pos-cart-item">
                  <div className="pos-cart-item-info">
                    <div className="pos-cart-item-name">{item.name}</div>
                    <div className="pos-cart-item-price">
                      RWF {Math.round(item.unitPrice).toLocaleString()} each
                    </div>
                  </div>
                  <div className="pos-cart-qty">
                    <button onClick={() => updateQty(item.medicineId, -1)}>
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.medicineId, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      minWidth: 80,
                      textAlign: "right",
                    }}
                  >
                    RWF{" "}
                    {Math.round(
                      item.unitPrice * item.quantity,
                    ).toLocaleString()}
                  </span>
                  <button
                    className="btn-ghost"
                    onClick={() => removeItem(item.medicineId)}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="pos-cart-footer">
            <div style={{ marginBottom: 12 }}>
              <select
                className="filter-select w-full"
                style={{ width: "100%", marginBottom: 8 }}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className="filter-select w-full"
                style={{ width: "100%" }}
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentMethod(val);
                  if (val === "Cash") setPaymentReference("");
                }}
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Mobile</option>
              </select>

              {paymentMethod === "Card" && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Card Number <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    required
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </div>
              )}

              {paymentMethod === "Mobile" && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Mobile Money Phone{" "}
                    <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="+250 7XX XXX XXX"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    required
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </div>
              )}
            </div>
            <div className="pos-cart-total">
              <span>Total</span>
              <span>RWF {Math.round(total).toLocaleString()}</span>
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ width: "100%" }}
              disabled={
                cart.length === 0 ||
                submitting ||
                (paymentMethod !== "Cash" && !paymentReference.trim())
              }
              onClick={completeSale}
            >
              {submitting ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
