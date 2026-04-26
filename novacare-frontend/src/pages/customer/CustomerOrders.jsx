import { useState, useEffect } from "react";
import api from "../../api/axios";
import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/my")
      .then((r) => setOrders(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s) => {
    switch (s) {
      case "Approved":
        return "badge-primary";
      case "Completed":
        return "badge-success";
      case "Rejected":
        return "badge-danger";
      default:
        return "badge-warning";
    }
  };

  if (loading)
    return (
      <div
        style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}
      >
        Loading...
      </div>
    );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>
          My Orders
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Track your online orders placed through NovaCare
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "var(--card-bg)",
            borderRadius: 16,
            border: "1px solid var(--border-color)",
          }}
        >
          <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            You haven&apos;t placed any orders yet.
          </p>
          <Link to="/customer/medicines" className="btn btn-primary">
            Browse Medicines
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "var(--card-bg, #fff)",
                border: "1px solid var(--border-color)",
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      marginBottom: 4,
                    }}
                  >
                    Order #{order.id}
                  </div>
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                  >
                    {new Date(order.orderDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {order.branch && ` · ${order.branch.name}`}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span className={`badge ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {order.paymentMethod && (
                    <span className="badge badge-gray">
                      {order.paymentMethod}
                    </span>
                  )}
                  {order.paymentReference && (
                    <span
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Ref: {order.paymentReference}
                    </span>
                  )}
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                    RWF {Math.round(order.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
              {order.items?.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: 12,
                  }}
                >
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        {item.medicine?.brandName || `Med #${item.medicineId}`}{" "}
                        &times; {item.quantity}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        RWF{" "}
                        {Math.round(
                          item.unitPrice * item.quantity,
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
