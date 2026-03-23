import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import DashboardLayout from './layouts/DashboardLayout';
import ShopLayout from './layouts/ShopLayout';

import Login from './pages/Login';

import Dashboard from './pages/dashboard/Dashboard';
import Medicines from './pages/dashboard/Medicines';
import MedicineForm from './pages/dashboard/MedicineForm';
import Batches from './pages/dashboard/Batches';
import BatchForm from './pages/dashboard/BatchForm';
import Sales from './pages/dashboard/Sales';
import NewSale from './pages/dashboard/NewSale';
import Customers from './pages/dashboard/Customers';
import Orders from './pages/dashboard/Orders';
import Reports from './pages/dashboard/Reports';
import Users from './pages/dashboard/Users';
import ContactMessages from './pages/dashboard/ContactMessages';
import AuditLog from './pages/dashboard/AuditLog';
import Settings from './pages/dashboard/Settings';

import ShopHome from './pages/shop/ShopHome';
import ShopMedicines from './pages/shop/ShopMedicines';
import MedicineDetail from './pages/shop/MedicineDetail';
import Cart from './pages/shop/Cart';
import PlaceOrder from './pages/shop/PlaceOrder';
import Contact from './pages/shop/Contact';
import About from './pages/shop/About';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          You don&apos;t have permission to access this page. Contact your administrator.
        </p>
        <a href="/dashboard" className="btn btn-primary">Back to Dashboard</a>
      </div>
    );
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop" replace />} />
      <Route path="/login" element={<Login />} />

      <Route path="/shop" element={<ShopLayout />}>
        <Route index element={<ShopHome />} />
        <Route path="medicines" element={<ShopMedicines />} />
        <Route path="medicines/:id" element={<MedicineDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="order" element={<PlaceOrder />} />
        <Route path="contact" element={<Contact />} />
        <Route path="about" element={<About />} />
      </Route>

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="medicines" element={<RequirePermission permission="ViewMedicines"><Medicines /></RequirePermission>} />
        <Route path="medicines/new" element={<RequirePermission permission="CreateMedicines"><MedicineForm /></RequirePermission>} />
        <Route path="medicines/:id/edit" element={<RequirePermission permission="EditMedicines"><MedicineForm /></RequirePermission>} />
        <Route path="batches" element={<RequirePermission permission="ViewBatches"><Batches /></RequirePermission>} />
        <Route path="batches/new" element={<RequirePermission permission="CreateBatches"><BatchForm /></RequirePermission>} />
        <Route path="sales" element={<RequirePermission permission="ViewSales"><Sales /></RequirePermission>} />
        <Route path="sales/new" element={<RequirePermission permission="CreateSales"><NewSale /></RequirePermission>} />
        <Route path="customers" element={<RequirePermission permission="ViewCustomers"><Customers /></RequirePermission>} />
        <Route path="orders" element={<RequirePermission permission="ViewOrders"><Orders /></RequirePermission>} />
        <Route path="reports" element={<RequirePermission permission="ViewReports"><Reports /></RequirePermission>} />
        <Route path="users" element={<RequirePermission permission="ViewUsers"><Users /></RequirePermission>} />
        <Route path="contact-messages" element={<RequirePermission permission="ViewContactMessages"><ContactMessages /></RequirePermission>} />
        <Route path="audit-log" element={<RequirePermission permission="ViewAuditLog"><AuditLog /></RequirePermission>} />
        <Route path="settings" element={<RequirePermission permission="ManageSettings"><Settings /></RequirePermission>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
