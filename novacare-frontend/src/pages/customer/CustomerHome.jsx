import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Package,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { getMedicines } from "../../api/medicines";
import { getBatches } from "../../api/batches";
import api from "../../api/axios";

export default function CustomerHome() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api
        .get("/orders/my")
        .then((r) => r.data || [])
        .catch(() => []),
      getMedicines().catch(() => []),
      getBatches().catch(() => []),
    ])
      .then(([ord, meds, batchData]) => {
        setOrders(Array.isArray(ord) ? ord : []);
        setMedicines(Array.isArray(meds) ? meds : []);
        setBatches(Array.isArray(batchData) ? batchData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const totalSpent = orders
    .filter((o) => o.status === "Completed" || o.status === "Approved")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const availableMedicines = medicines.filter((med) => {
    const today = new Date();
    return batches.some(
      (b) =>
        b.medicineId === med.id &&
        b.remainingQuantity > 0 &&
        new Date(b.expiryDate) > today,
    );
  });

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    .slice(0, 5);

  const statusColor = (s) => {
    switch (s) {
      case "Approved":
        return { bg: "#eff6ff", color: "#1d4ed8" };
      case "Completed":
        return { bg: "#f0fdf4", color: "#15803d" };
      case "Rejected":
        return { bg: "#fef2f2", color: "#dc2626" };
      default:
        return { bg: "#fffbeb", color: "#b45309" };
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Welcome back, {currentUser?.firstName}!
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          How can we help you today?
        </p>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            padding: 40,
            color: "var(--text-muted)",
          }}
        >
          <RefreshCw
            size={20}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Loading your dashboard...
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              {
                label: "Medicines Available",
                value: availableMedicines.length,
                sub: "in stock across branches",
                color: "#0d9488",
                icon: Package,
                to: "/customer/medicines",
              },
              {
                label: "Total Orders",
                value: orders.length,
                sub: `${orders.filter((o) => o.status === "Pending").length} pending`,
                color: "#6366f1",
                icon: ClipboardList,
                to: "/customer/orders",
              },
              {
                label: "Total Spent",
                value: `RWF ${Math.round(totalSpent).toLocaleString()}`,
                sub: "on approved & completed orders",
                color: "#f59e0b",
                icon: TrendingUp,
                to: "/customer/orders",
              },
            ].map(({ label, value, sub, color, icon, to }) => {
              const Icon = icon;
              return (
                <Link key={label} to={to} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      background: "var(--card-bg, #fff)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 14,
                      padding: "20px 22px",
                      transition: "box-shadow 0.15s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.08)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {label}
                      </span>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: `${color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={17} color={color} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {sub}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Main content: recent orders + available medicines */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: 24,
              alignItems: "start",
            }}
          >
            {/* Recent orders */}
            <div
              style={{
                background: "var(--card-bg, #fff)",
                border: "1px solid var(--border-color)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
                  Recent Orders
                </h3>
                <Link
                  to="/customer/orders"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.82rem",
                    color: "var(--primary)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div
                  style={{
                    padding: "40px 22px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <ClipboardList
                    size={32}
                    style={{ opacity: 0.25, marginBottom: 10 }}
                  />
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>
                    No orders yet
                  </p>
                  <Link
                    to="/customer/medicines"
                    style={{
                      display: "inline-block",
                      marginTop: 12,
                      fontSize: "0.85rem",
                      color: "var(--primary)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Browse medicines →
                  </Link>
                </div>
              ) : (
                recentOrders.map((order, i) => {
                  const sc = statusColor(order.status);
                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: "14px 22px",
                        borderBottom:
                          i < recentOrders.length - 1
                            ? "1px solid var(--border-color)"
                            : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            marginBottom: 3,
                          }}
                        >
                          Order #{order.id}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {new Date(order.orderDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                          {order.branch ? ` · ${order.branch.name}` : ""}
                        </div>
                        {order.items?.length > 0 && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 280,
                            }}
                          >
                            {order.items
                              .map(
                                (it) =>
                                  it.medicine?.brandName ||
                                  `Med #${it.medicineId}`,
                              )
                              .join(", ")}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background: sc.bg,
                            color: sc.color,
                          }}
                        >
                          {order.status}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.88rem",
                            color: "var(--primary)",
                          }}
                        >
                          RWF {Math.round(order.totalAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Available medicines */}
            <div
              style={{
                background: "var(--card-bg, #fff)",
                border: "1px solid var(--border-color)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
                  Medicines in Stock
                </h3>
                <Link
                  to="/customer/medicines"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.82rem",
                    color: "var(--primary)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              {availableMedicines.slice(0, 6).map((med, i) => {
                const stock = batches
                  .filter(
                    (b) =>
                      b.medicineId === med.id &&
                      b.remainingQuantity > 0 &&
                      new Date(b.expiryDate) > new Date(),
                  )
                  .reduce((s, b) => s + b.remainingQuantity, 0);
                return (
                  <div
                    key={med.id}
                    style={{
                      padding: "12px 22px",
                      borderBottom:
                        i < Math.min(availableMedicines.length, 6) - 1
                          ? "1px solid var(--border-color)"
                          : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {med.brandName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {med.genericName} · {med.strength}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          color: "var(--primary)",
                        }}
                      >
                        RWF {Math.round(med.price).toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: stock > 10 ? "#16a34a" : "#d97706",
                          fontWeight: 600,
                        }}
                      >
                        {stock} left
                      </div>
                    </div>
                  </div>
                );
              })}
              {availableMedicines.length === 0 && (
                <div
                  style={{
                    padding: "40px 22px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <Package
                    size={32}
                    style={{ opacity: 0.25, marginBottom: 10 }}
                  />
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>
                    No medicines in stock right now
                  </p>
                </div>
              )}
              <Link
                to="/customer/medicines"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "14px",
                  borderTop: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                  color: "var(--primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ShoppingCart size={15} /> Order medicines
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
