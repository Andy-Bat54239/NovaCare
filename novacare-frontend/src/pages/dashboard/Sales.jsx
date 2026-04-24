import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSales } from '../../api/sales';
import { Plus, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function Sales() {
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSales();
        setSales(data || []);
      } catch (err) {
        console.error('Failed to load sales:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() =>
    sales.filter(s => {
      const matchSearch = !search || s.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
      const matchPayment = !paymentFilter || s.paymentMethod === paymentFilter;
      return matchSearch && matchPayment;
    }), [sales, search, paymentFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading sales...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales</h1>
          <p className="page-header-subtitle">{sales.length} total transactions</p>
        </div>
        {hasPermission('CreateSales') && (
          <Link to="/dashboard/sales/new" className="btn btn-primary"><Plus size={18} /> New Sale</Link>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search invoices..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}>
          <option value="">All Payments</option>
          <option>Cash</option>
          <option>Card</option>
          <option>Mobile</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>No sales found</td></tr>
            ) : paginated.map(sale => {
              const isExpanded = expandedId === sale.id;
              const customerName = sale.customerName || (sale.customerId ? `Customer #${sale.customerId}` : null);
              return (
                <React.Fragment key={sale.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : sale.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                    <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td>{customerName || <span className="text-muted">Walk-in</span>}</td>
                    <td>{(sale.items || []).length}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>RWF {Math.round(sale.totalAmount).toLocaleString()}</td>
                    <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                    <td>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${sale.id}-details`}>
                      <td colSpan={7} style={{ background: 'var(--gray-50)', padding: '16px 24px' }}>
                        <table className="data-table" style={{ marginBottom: 0 }}>
                          <thead>
                            <tr><th>Medicine</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                          </thead>
                          <tbody>
                            {(sale.items || []).map((item, i) => (
                              <tr key={i}>
                                <td>{item.medicine?.brandName || `Medicine #${item.medicineId}`}</td>
                                <td>{item.quantity}</td>
                                <td>RWF {Math.round(item.unitPrice).toLocaleString()}</td>
                                <td>RWF {Math.round(item.subtotal).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {sale.notes && <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Notes: {sale.notes}</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
