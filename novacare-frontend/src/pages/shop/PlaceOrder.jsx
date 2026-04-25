import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getBranches } from "../../api/branches";
import { createOrder, uploadPrescriptionForItem } from "../../api/orders";
import { CheckCircle, AlertTriangle, FileImage } from "lucide-react";

export default function PlaceOrder() {
  const { cartItems, getTotal, clearCart } = useCart();
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: "",
    paymentMethod: "Cash",
    paymentReference: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = getTotal();

  useEffect(() => {
    getBranches()
      .then((data) => {
        const active = (data || []).filter((b) => b.isActive);
        setBranches(active);
        if (active.length > 0)
          setForm((f) => ({ ...f, branchId: String(active[0].id) }));
      })
      .catch(() => {});
  }, []);

  const rxItems = cartItems.filter((i) => i.requiresPrescription);
  const missingPrescriptions = rxItems.filter((i) => !i.prescriptionDataUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (missingPrescriptions.length > 0 || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const orderPayload = {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        branchId: Number(form.branchId),
        paymentMethod: form.paymentMethod,
        paymentReference:
          form.paymentMethod !== "Cash" ? form.paymentReference : null,
        totalAmount: total,
        hasPrescription: cartItems.some((i) => i.prescriptionDataUrl),
        items: cartItems.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.price,
          // prescriptions will be uploaded separately after order creation
        })),
      };

      const created = await createOrder(orderPayload);
      setOrderId(created.id || `ORD-${Date.now().toString().slice(-6)}`);

      // Upload prescription images to the server for every Rx item that has one.
      // Match each cart item to its server-assigned OrderItem by medicineId.
      const rxWithPrescriptions = cartItems.filter(
        (i) => i.prescriptionDataUrl && i.requiresPrescription,
      );
      if (rxWithPrescriptions.length > 0 && Array.isArray(created.items)) {
        await Promise.all(
          rxWithPrescriptions.map(async (cartItem) => {
            const orderItem = created.items.find(
              (i) => i.medicineId === cartItem.medicineId,
            );
            if (!orderItem?.id) return;

            try {
              // Convert base64 data URL → Blob → File so it can be sent as multipart
              const fetchRes = await fetch(cartItem.prescriptionDataUrl);
              const blob = await fetchRes.blob();
              const ext = cartItem.prescriptionName?.split(".").pop() || "jpg";
              const file = new File(
                [blob],
                cartItem.prescriptionName || `prescription.${ext}`,
                { type: blob.type },
              );
              await uploadPrescriptionForItem(created.id, orderItem.id, file);
            } catch (uploadErr) {
              // Non-fatal: order is placed; staff can request the prescription manually
              console.error(
                "Prescription upload failed for",
                cartItem.name,
                uploadErr,
              );
            }
          }),
        );
      }

      clearCart();
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to place order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="shop-section">
        <div className="success-page">
          <div className="success-icon">
            <CheckCircle size={40} />
          </div>
          <h1>Order Placed Successfully!</h1>
          <p>
            Your order <strong>#{orderId}</strong> has been submitted and is
            awaiting approval.
          </p>
          <p className="text-muted">
            You will receive a confirmation once staff review your order.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Link to="/shop" className="btn btn-primary">
              Back to Home
            </Link>
            <Link to="/shop/medicines" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="shop-section">
        <div className="empty-state">
          <h3>No items to order</h3>
          <Link to="/shop/medicines" className="btn btn-primary mt-3">
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-section" style={{ paddingTop: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Place Your Order</h2>
      <div className="order-layout">
        <div className="card">
          <div className="card-body">
            {missingPrescriptions.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                <AlertTriangle size={16} />
                <strong>Prescription required:</strong> Please go back and
                upload a prescription for:{" "}
                {missingPrescriptions.map((i) => i.name).join(", ")}
              </div>
            )}

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

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    required
                    placeholder="+250 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pickup Branch</label>
                <select
                  className="form-select"
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({ ...form, branchId: e.target.value })
                  }
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={form.paymentMethod}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => ({
                      ...f,
                      paymentMethod: val,
                      paymentReference:
                        val === "Cash" ? "" : f.paymentReference,
                    }));
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>

              {form.paymentMethod === "Card" && (
                <div className="form-group">
                  <label className="form-label">
                    Card Number <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={form.paymentReference}
                    onChange={(e) =>
                      setForm({ ...form, paymentReference: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {form.paymentMethod === "Mobile" && (
                <div className="form-group">
                  <label className="form-label">
                    Mobile Money Phone{" "}
                    <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="+250 7XX XXX XXX"
                    value={form.paymentReference}
                    onChange={(e) =>
                      setForm({ ...form, paymentReference: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {rxItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Prescriptions Attached</label>
                  {rxItems.map((item) => (
                    <div
                      key={item.medicineId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 8,
                        marginBottom: 8,
                        background: item.prescriptionDataUrl
                          ? "var(--success-bg)"
                          : "var(--danger-bg)",
                        border: `1px solid ${item.prescriptionDataUrl ? "var(--success)" : "var(--danger)"}`,
                      }}
                    >
                      <FileImage
                        size={18}
                        style={{
                          color: item.prescriptionDataUrl
                            ? "var(--success)"
                            : "var(--danger)",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.prescriptionDataUrl
                            ? `✓ ${item.prescriptionName || "Prescription uploaded"}`
                            : "✗ No prescription — go back to upload"}
                        </div>
                      </div>
                      {item.prescriptionDataUrl &&
                        !item.prescriptionName?.endsWith(".pdf") && (
                          <img
                            src={item.prescriptionDataUrl}
                            alt="rx"
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%" }}
                disabled={
                  missingPrescriptions.length > 0 ||
                  submitting ||
                  (form.paymentMethod !== "Cash" &&
                    !form.paymentReference.trim())
                }
              >
                {submitting
                  ? "Placing Order..."
                  : `Place Order — RWF ${Math.round(total).toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>

        <div className="order-summary-card">
          <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
          {cartItems.map((item) => (
            <div
              key={item.medicineId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border-color)",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div className="text-muted">
                  Qty: {item.quantity}
                  {item.requiresPrescription ? " · Rx" : ""}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>
                RWF {Math.round(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 16,
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            <span>Total</span>
            <span style={{ color: "var(--primary)" }}>
              RWF {Math.round(total).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
