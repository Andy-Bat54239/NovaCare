import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSales } from "../../api/sales";
import { getMedicines } from "../../api/medicines";
import { getBranches } from "../../api/branches";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Download,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#0d9488",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
  "#f97316",
];

// ── Date helpers ────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split("T")[0];
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "7 days", days: 6 },
  { label: "30 days", days: 29 },
  { label: "90 days", days: 89 },
  { label: "This year", days: null, year: true },
  { label: "All time", days: null },
];

function applyPreset(preset) {
  const t = today();
  if (preset.year) {
    return { from: `${t.getFullYear()}-01-01`, to: toISO(t) };
  }
  if (preset.days === null) return { from: "", to: "" };
  const from = new Date(t);
  from.setDate(t.getDate() - preset.days);
  return { from: toISO(from), to: toISO(t) };
}

// ── Filter bar sub-component ────────────────────────────────────────────────
function FilterBar({ filters, setFilters, branches, categories, onReset }) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    filters.from,
    filters.to,
    filters.branchId !== "",
    filters.paymentMethod !== "",
    filters.category !== "",
    filters.minAmount !== "",
    filters.maxAmount !== "",
  ].filter(Boolean).length;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      {/* Date presets */}
      <div style={{ display: "flex", gap: 4 }}>
        {PRESETS.map((p) => {
          const applied = applyPreset(p);
          const active =
            (applied.from || "") === filters.from &&
            (applied.to || "") === filters.to;
          return (
            <button
              key={p.label}
              onClick={() => setFilters((f) => ({ ...f, ...applyPreset(p) }))}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: "0.8rem",
                border: `1px solid ${active ? "var(--primary)" : "var(--border-color)"}`,
                background: active ? "var(--primary)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* More filters toggle */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${activeCount > 0 ? "var(--primary)" : "var(--border-color)"}`,
            background:
              activeCount > 0 ? "var(--primary-50, #f0fdfa)" : "transparent",
            color: activeCount > 0 ? "var(--primary)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          <Filter size={14} />
          Filters{" "}
          {activeCount > 0 && (
            <span
              style={{
                background: "var(--primary)",
                color: "#fff",
                borderRadius: 99,
                padding: "0 5px",
                fontSize: "0.7rem",
                fontWeight: 700,
              }}
            >
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              transform: open ? "rotate(180deg)" : undefined,
              transition: "transform 0.2s",
            }}
          />
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              minWidth: 340,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              zIndex: 50,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">From date</label>
                <input
                  className="form-input"
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, from: e.target.value }))
                  }
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">To date</label>
                <input
                  className="form-input"
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, to: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Branch</label>
              <select
                className="form-select"
                value={filters.branchId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, branchId: e.target.value }))
                }
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment method</label>
              <select
                className="form-select"
                value={filters.paymentMethod}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, paymentMethod: e.target.value }))
                }
              >
                <option value="">All methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Medicine category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Min amount (RWF)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, minAmount: e.target.value }))
                  }
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max amount (RWF)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  placeholder="∞"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, maxAmount: e.target.value }))
                  }
                />
              </div>
            </div>

            <button
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: "var(--danger)",
                cursor: "pointer",
                fontSize: "0.85rem",
                padding: 0,
              }}
            >
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {filters.branchId && (
        <Chip
          label={`Branch: ${branches.find((b) => String(b.id) === filters.branchId)?.name?.split(" ")[0]}`}
          onRemove={() => setFilters((f) => ({ ...f, branchId: "" }))}
        />
      )}
      {filters.paymentMethod && (
        <Chip
          label={`Payment: ${filters.paymentMethod}`}
          onRemove={() => setFilters((f) => ({ ...f, paymentMethod: "" }))}
        />
      )}
      {filters.category && (
        <Chip
          label={`Category: ${filters.category}`}
          onRemove={() => setFilters((f) => ({ ...f, category: "" }))}
        />
      )}
      {filters.minAmount && (
        <Chip
          label={`Min: RWF ${Number(filters.minAmount).toLocaleString()}`}
          onRemove={() => setFilters((f) => ({ ...f, minAmount: "" }))}
        />
      )}
      {filters.maxAmount && (
        <Chip
          label={`Max: RWF ${Number(filters.maxAmount).toLocaleString()}`}
          onRemove={() => setFilters((f) => ({ ...f, maxAmount: "" }))}
        />
      )}
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 99,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: "var(--primary-50, #f0fdfa)",
        color: "var(--primary)",
        border: "1px solid var(--primary)",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          padding: 0,
          display: "flex",
        }}
      >
        <X size={12} />
      </button>
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  from: "",
  to: "",
  branchId: "",
  paymentMethod: "",
  category: "",
  minAmount: "",
  maxAmount: "",
};

export default function Reports() {
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    Promise.all([getSales(), getMedicines(), getBranches()])
      .then(([s, m, b]) => {
        setSales(Array.isArray(s) ? s : []);
        setMedicines(Array.isArray(m) ? m : []);
        setBranches(Array.isArray(b) ? b : []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load report data."),
      )
      .finally(() => setLoading(false));
  }, []);

  // Derive categories from medicines data
  const categories = useMemo(
    () => [...new Set(medicines.map((m) => m.category))].sort(),
    [medicines],
  );

  // Medicine ID → category map for category filtering on sale items
  const medicineCategory = useMemo(() => {
    const map = {};
    medicines.forEach((m) => {
      map[m.id] = m.category;
    });
    return map;
  }, [medicines]);

  // Apply all filters to the raw sales array
  const filteredSales = useMemo(() => {
    let result = sales;

    if (filters.from) {
      result = result.filter((s) => (s.saleDate || "") >= filters.from);
    }
    if (filters.to) {
      // include the full "to" day by using the next day boundary
      const toEnd = filters.to + "T23:59:59";
      result = result.filter((s) => (s.saleDate || "") <= toEnd);
    }
    if (filters.branchId) {
      result = result.filter((s) => String(s.branchId) === filters.branchId);
    }
    if (filters.paymentMethod) {
      result = result.filter((s) => s.paymentMethod === filters.paymentMethod);
    }
    if (filters.minAmount !== "") {
      result = result.filter(
        (s) => (s.totalAmount || 0) >= Number(filters.minAmount),
      );
    }
    if (filters.maxAmount !== "") {
      result = result.filter(
        (s) => (s.totalAmount || 0) <= Number(filters.maxAmount),
      );
    }
    if (filters.category) {
      // Keep sales that include at least one item from the selected category
      result = result.filter((s) =>
        (s.items || []).some(
          (i) => medicineCategory[i.medicineId] === filters.category,
        ),
      );
    }

    return result;
  }, [sales, filters, medicineCategory]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (filteredSales.length === 0)
      return {
        totalSales: 0,
        totalRevenue: 0,
        avgSale: 0,
        topMedicine: "N/A",
        totalUnits: 0,
      };
    const totalRevenue = filteredSales.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0,
    );
    const avgSale = totalRevenue / filteredSales.length;
    const itemCounts = {};
    let totalUnits = 0;
    filteredSales.forEach((s) =>
      (s.items || []).forEach((i) => {
        itemCounts[i.medicineId] = (itemCounts[i.medicineId] || 0) + i.quantity;
        totalUnits += i.quantity;
      }),
    );
    const topMedId = Object.entries(itemCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const topMed = medicines.find((m) => m.id === Number(topMedId));
    return {
      totalSales: filteredSales.length,
      totalRevenue,
      avgSale,
      topMedicine: topMed?.brandName || "N/A",
      totalUnits,
    };
  }, [filteredSales, medicines]);

  // ── Revenue trend (30 days or date range) ────────────────────────────────
  const trendData = useMemo(() => {
    // Build a day-by-day array covering the filter range or last 30 days
    const t = today();
    let startDay, endDay;
    if (filters.from) {
      startDay = new Date(filters.from);
      startDay.setHours(0, 0, 0, 0);
    } else {
      startDay = new Date(t);
      startDay.setDate(t.getDate() - 29);
    }
    endDay = filters.to ? new Date(filters.to) : t;
    endDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((endDay - startDay) / 86400000);
    // Cap at 90 days for readability; show weekly buckets if > 60 days
    const useWeekly = diffDays > 60;
    const days = [];
    const cur = new Date(startDay);
    while (cur <= endDay) {
      const ds = toISO(cur);
      if (useWeekly) {
        // Bucket by start-of-week
        const weekStart = toISO(cur);
        const weekEnd = new Date(cur);
        weekEnd.setDate(cur.getDate() + 6);
        const weDs = toISO(weekEnd);
        const daySales = filteredSales.filter(
          (s) =>
            (s.saleDate || "") >= weekStart &&
            (s.saleDate || "") <= weDs + "T23:59:59",
        );
        days.push({
          date: cur.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
          count: daySales.length,
        });
        cur.setDate(cur.getDate() + 7);
      } else {
        const daySales = filteredSales.filter((s) =>
          (s.saleDate || "").startsWith(ds),
        );
        days.push({
          date: cur.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
          count: daySales.length,
        });
        cur.setDate(cur.getDate() + 1);
      }
    }
    return days;
  }, [filteredSales, filters.from, filters.to]);

  // ── Payment methods ───────────────────────────────────────────────────────
  const paymentData = useMemo(() => {
    const counts = {};
    filteredSales.forEach((s) => {
      const method = s.paymentMethod || "Unknown";
      counts[method] = (counts[method] || 0) + (s.totalAmount || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
  }, [filteredSales]);

  // ── Revenue by branch ─────────────────────────────────────────────────────
  const branchData = useMemo(
    () =>
      branches
        .filter((b) => b.isActive)
        .map((b) => ({
          name: b.name.split(" ").slice(0, 2).join(" "),
          revenue: filteredSales
            .filter((s) => s.branchId === b.id)
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0),
          sales: filteredSales.filter((s) => s.branchId === b.id).length,
        })),
    [branches, filteredSales],
  );

  // ── Revenue by category ───────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const revenue = {};
    filteredSales.forEach((s) =>
      (s.items || []).forEach((i) => {
        const cat = medicineCategory[i.medicineId] || "Unknown";
        revenue[cat] = (revenue[cat] || 0) + i.quantity * (i.unitPrice || 0);
      }),
    );
    return Object.entries(revenue)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales, medicineCategory]);

  // ── Top 10 medicines ──────────────────────────────────────────────────────
  const topMeds = useMemo(() => {
    const counts = {};
    const revenue = {};
    filteredSales.forEach((s) =>
      (s.items || []).forEach((i) => {
        counts[i.medicineId] = (counts[i.medicineId] || 0) + i.quantity;
        revenue[i.medicineId] =
          (revenue[i.medicineId] || 0) + i.quantity * (i.unitPrice || 0);
      }),
    );
    return Object.entries(counts)
      .map(([id, qty]) => ({
        name: medicines.find((m) => m.id === Number(id))?.brandName || `#${id}`,
        category: medicines.find((m) => m.id === Number(id))?.category || "",
        quantity: qty,
        revenue: Math.round(revenue[id] || 0),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredSales, medicines]);

  // ── Hourly distribution ───────────────────────────────────────────────────
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      count: 0,
      revenue: 0,
    }));
    filteredSales.forEach((s) => {
      const h = new Date(s.saleDate || "").getHours();
      if (!isNaN(h)) {
        hours[h].count += 1;
        hours[h].revenue += s.totalAmount || 0;
      }
    });
    // Trim leading/trailing zeros for cleaner chart
    let first = hours.findIndex((h) => h.count > 0);
    let last = hours.findLastIndex((h) => h.count > 0);
    if (first === -1) return hours;
    return hours.slice(Math.max(0, first - 1), Math.min(23, last + 2));
  }, [filteredSales]);

  // ── CSV Export (respects current filters) ─────────────────────────────────
  const exportCSV = () => {
    const header = "Invoice,Date,Customer,Branch,Total,Payment,Items\n";
    const rows = filteredSales
      .map((s) => {
        const customer = s.customer?.name || "Walk-in";
        const branch = branches.find((b) => b.id === s.branchId)?.name || "";
        const date = (s.saleDate || "").split("T")[0];
        const itemCount = (s.items || []).length;
        return `${s.invoiceNumber},${date},"${customer}","${branch}",${s.totalAmount},${s.paymentMethod || ""},${itemCount}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <RefreshCw
          size={32}
          style={{
            animation: "spin 1s linear infinite",
            color: "var(--primary)",
          }}
        />
      </div>
    );
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-header-subtitle">
            Sales analytics and insights
            {hasFilters && filteredSales.length !== sales.length && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                — showing {filteredSales.length} of {sales.length} sales
              </span>
            )}
          </p>
        </div>
        {hasPermission("ExportReports") && (
          <button
            className="btn btn-primary"
            onClick={exportCSV}
            disabled={filteredSales.length === 0}
          >
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        branches={branches.filter((b) => b.isActive)}
        categories={categories}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* KPI cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon primary">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-card-info">
            <h3>{stats.totalSales}</h3>
            <p>Total Sales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon success">
            <DollarSign size={24} />
          </div>
          <div className="stat-card-info">
            <h3>RWF {Math.round(stats.totalRevenue).toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon accent">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card-info">
            <h3>RWF {Math.round(stats.avgSale).toLocaleString()}</h3>
            <p>Avg Sale Value</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon info">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-card-info">
            <h3>{stats.totalUnits.toLocaleString()}</h3>
            <p>Units Dispensed</p>
          </div>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <h3>
            {sales.length === 0
              ? "No sales data yet"
              : "No sales match your filters"}
          </h3>
          <p className="text-muted">
            {sales.length === 0
              ? "Create a sale to see reports here."
              : "Try adjusting your filters to see more results."}
          </p>
          {hasFilters && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 12 }}
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Row 1: Revenue trend + Payment methods */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>
                Revenue Trend{" "}
                {trendData.length > 0 && trendData.length <= 7
                  ? "(Daily)"
                  : trendData.length <= 60
                    ? "(Daily)"
                    : "(Weekly)"}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip
                    formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Payment Methods</h3>
              {paymentData.length === 0 ? (
                <p className="text-muted">No payment data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 2: Revenue by branch + Category breakdown */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Revenue by Branch</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={branchData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip
                    formatter={(v, name) => [
                      name === "revenue"
                        ? `RWF ${Math.round(v).toLocaleString()}`
                        : v,
                      name === "revenue" ? "Revenue" : "Sales count",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Revenue by Category</h3>
              {categoryData.length === 0 ? (
                <p className="text-muted">No category data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(v) => `RWF ${Math.round(v).toLocaleString()}`}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Revenue">
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 3: Sales by hour + Top medicines table */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Sales by Hour of Day</h3>
              {hourlyData.every((h) => h.count === 0) ? (
                <p className="text-muted">No hourly data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                    />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "Sales"]} />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="Sales"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="chart-card">
              <h3>Top 10 Medicines by Units Sold</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine</th>
                      <th>Category</th>
                      <th>Units</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMeds.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-muted"
                          style={{ textAlign: "center", padding: 20 }}
                        >
                          No items sold yet.
                        </td>
                      </tr>
                    ) : (
                      topMeds.map((m, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              color: "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            {i + 1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td>
                            <span
                              className="badge badge-gray"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {m.category}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-primary">
                              {m.quantity}
                            </span>
                          </td>
                          <td
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            RWF {m.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
