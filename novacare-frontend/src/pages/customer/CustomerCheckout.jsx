import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getBranches } from "../../api/branches";
import { createOrder, uploadPrescriptionForItem } from "../../api/orders";
import { CheckCircle, ShoppingCart, Trash2, FileImage } from "lucide-react";

export default function CustomerCheckout() {
  const { currentUser } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotal } =
    useCart();

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    getBranches()
      .then((data) => {
        const active = (data || []).filter((b) => b.isActive);
        setBranches(active);
        if (active.length > 0) setBranchId(String(active[0].id));
      })
      .catch(() => {});
  }, []);

  const total = getTotal();
  const missingRx = cartItems.filter(
    (i) => i.requiresPrescription && !i.prescriptionDataUrl,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !branchId ||
      submitting ||
      cartItems.length === 0 ||
      missingRx.length > 0
    )
      return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        customerName: `${currentUser.firstName} ${currentUser.lastName}`,
        customerEmail: currentUser.email,
        customerPhone: phone || "N/A",
        branchId: Number(branchId),
        paymentMethod,
        paymentReference: paymentMethod !== "Cash" ? paymentReference : null,
        totalAmount: total,
        hasPrescription: cartItems.some((i) => i.prescriptionDataUrl),
        items: cartItems.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      };
      const created = await createOrder(payload);

      // Upload prescription images for every Rx item that has one
      const rxItems = cartItems.filter(
        (i) => i.prescriptionDataUrl && i.requiresPrescription,
      );
      if (rxItems.length > 0 && Array.isArray(created.items)) {
        await Promise.all(
          rxItems.map(async (cartItem) => {
            const orderItem = created.items.find(
              (oi) => oi.medicineId === cartItem.medicineId,
            );
            if (!orderItem?.id) return;
            try {
              const fetchRes = await fetch(cartItem.prescriptionDataUrl);
              const blob = await fetchRes.blob();
              const ext = cartItem.prescriptionName?.split(".").pop() || "jpg";
              const file = new File(
                [blob],
                cartItem.prescriptionName || `prescription.${ext}`,
                { type: blob.type },
              );
              await uploadPrescriptionForItem(created.id, orderItem.id, file);
            } catch {
              // Non-fatal — staff can request manually
            }
          }),
        );
      }

      clearCart();
      setOrderId(created.id);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to place order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "60px auto",
          textAlign: "center",
          padding: "40px 32px",
          background: "var(--card-bg, #fff)",
          borderRadius: 20,
          border: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#f0fdf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle size={36} color="#22c55e" />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 10 }}>
          Order Placed!
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 6 }}>
          Order <strong>#{orderId}</strong> has been submitted and is awaiting
          staff approval.
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginBottom: 28,
          }}
        >
          You can track its status in My Orders.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/customer/orders" className="btn btn-primary">
            View My Orders
          </Link>
          <Link to="/customer/medicines" className="btn btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
          Your cart is empty.
        </p>
        <Link to="/customer/medicines" className="btn btn-primary">
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>
          Checkout
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Review your order and confirm
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left: order details form */}
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "24px 28px",
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem" }}>
            Your Details
          </h3>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Auto-filled read-only fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={`${currentUser.firstName} ${currentUser.lastName}`}
                readOnly
                style={{
                  background: "var(--bg-base, #f8fafc)",
                  cursor: "default",
                  color: "var(--text-muted)",
                }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={currentUser.email}
                readOnly
                style={{
                  background: "var(--bg-base, #f8fafc)",
                  cursor: "default",
                  color: "var(--text-muted)",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Phone{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                className="form-input"
                placeholder="+250 7XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pickup Branch</label>
              <select
                className="form-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => {
                const val = e.target.value;
                setPaymentMethod(val);
                if (val === "Cash") setPaymentReference("");
              }}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile">Mobile</option>
            </select>
          </div>

          {paymentMethod === "Card" && (
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">
                Card Number <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                className="form-input"
                placeholder="XXXX XXXX XXXX XXXX"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                required
              />
            </div>
          )}

          {paymentMethod === "Mobile" && (
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">
                Mobile Money Phone <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                className="form-input"
                placeholder="+250 7XX XXX XXX"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                required
              />
            </div>
          )}

          {missingRx.length > 0 && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
                fontSize: "0.875rem",
                color: "#991b1b",
              }}
            >
              <strong>Prescription missing</strong> for:{" "}
              {missingRx.map((i) => i.name).join(", ")}.<br />
              Go back to Medicines and re-add these items with a prescription
              photo.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !branchId ||
              missingRx.length > 0 ||
              (paymentMethod !== "Cash" && !paymentReference.trim())
            }
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "13px",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            {submitting
              ? "Placing Order..."
              : `Confirm Order · RWF ${Math.round(total).toLocaleString()}`}
          </button>
        </div>

        {/* Right: cart summary */}
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "24px 28px",
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1rem" }}>
            Order Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {cartItems.map((item) => (
              <div
                key={item.medicineId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    RWF {Math.round(item.price).toLocaleString()} ×{" "}
                    {item.quantity}
                  </div>
                  {item.requiresPrescription && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.73rem",
                        marginTop: 2,
                        color: item.prescriptionDataUrl ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      <FileImage size={11} />
                      {item.prescriptionDataUrl
                        ? "Rx attached"
                        : "Rx missing — go back to add"}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() =>
                      updateQuantity(item.medicineId, item.quantity - 1)
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "1px solid var(--border-color)",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontWeight: 700,
                      minWidth: 18,
                      textAlign: "center",
                      fontSize: "0.88rem",
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.medicineId, item.quantity + 1)
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "1px solid var(--border-color)",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  RWF {Math.round(item.price * item.quantity).toLocaleString()}
                </span>
                <button
                  onClick={() => removeFromCart(item.medicineId)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    padding: 4,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 16,
              fontWeight: 800,
              fontSize: "1.05rem",
            }}
          >
            <span>Total</span>
            <span style={{ color: "var(--primary)" }}>
              RWF {Math.round(total).toLocaleString()}
            </span>
          </div>
          <Link
            to="/customer/medicines"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 16,
              fontSize: "0.85rem",
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            + Add more medicines
          </Link>
        </div>
      </div>
    </div>
  );
}
