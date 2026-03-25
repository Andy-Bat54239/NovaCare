import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sales } from '../../data/sales';
import { customers } from '../../data/customers';
import { medicines } from '../../data/medicines';
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function Sales() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() =>
    sales.filter(s => {
      const matchSearch = !search || s.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const matchPayment = !paymentFilter || s.paymentMethod === paymentFilter;
      return matchSearch && matchPayment;
    }).sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)), [search, paymentFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales</h1>
          <p className="page-header-subtitle">{sales.length} total transactions</p>
        </div>
        {hasPermission('CreateSales') && <Link to="/dashboard/sales/new" className="btn btn-primary"><Plus size={18} /> New Sale</Link>}
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
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(sale => {
              const customer = customers.find(c => c.id === sale.customerId);
              const isExpanded = expandedId === sale.id;
              return (
                <React.Fragment key={sale.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : sale.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                    <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td>{customer ? `${customer.firstName} ${customer.lastName}` : <span className="text-muted">Walk-in</span>}</td>
                    <td>{sale.items.length}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>RWF {sale.totalAmount.toLocaleString()}</td>
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
                            {sale.items.map((item, i) => {
                              const med = medicines.find(m => m.id === item.medicineId);
                              return (
                                <tr key={i}>
                                  <td>{med?.brandName || 'Unknown'}</td>
                                  <td>{item.quantity}</td>
                                  <td>RWF {item.unitPrice.toLocaleString()}</td>
                                  <td>RWF {item.subtotal.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
