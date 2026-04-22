import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

// Layouts
import ShopLayout from './layouts/ShopLayout'
import CustomerLayout from './layouts/CustomerLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'

// Shop pages
import ShopHome from './pages/shop/ShopHome'
import ShopMedicines from './pages/shop/ShopMedicines'
import Cart from './pages/shop/Cart'
import Contact from './pages/shop/Contact'
import PlaceOrder from './pages/shop/PlaceOrder'
import MedicineDetail from './pages/shop/MedicineDetail'
import OrderTracker from './pages/shop/OrderTracker'
import About from './pages/shop/About'

// Customer pages
import CustomerHome from './pages/customer/CustomerHome'
import CustomerMedicines from './pages/customer/CustomerMedicines'
import CustomerOrders from './pages/customer/CustomerOrders'
import CustomerChat from './pages/customer/CustomerChat'
import CustomerCheckout from './pages/customer/CustomerCheckout'
import CustomerProfile from './pages/customer/CustomerProfile'

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard'
import Medicines from './pages/dashboard/Medicines'
import Batches from './pages/dashboard/Batches'
import Sales from './pages/dashboard/Sales'
import Customers from './pages/dashboard/Customers'
import Orders from './pages/dashboard/Orders'
import Users from './pages/dashboard/Users'
import Reports from './pages/dashboard/Reports'
import Settings from './pages/dashboard/Settings'
import ContactMessages from './pages/dashboard/ContactMessages'
import AuditLog from './pages/dashboard/AuditLog'
import Chats from './pages/dashboard/Chats'

// Protected route wrappers
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (role && user.role !== role) return <Navigate to="/" />
  return children
}

const CustomerRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role !== 4) return <Navigate to="/dashboard" />
  return children
}

function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

import { AuthContext } from './context/AuthContext'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            
            {/* Shop */}
            <Route path="/shop" element={<ShopLayout><ShopHome /></ShopLayout>} />
            <Route path="/shop/medicines" element={<ShopLayout><ShopMedicines /></ShopLayout>} />
            <Route path="/shop/medicines/:id" element={<ShopLayout><MedicineDetail /></ShopLayout>} />
            <Route path="/shop/cart" element={<ShopLayout><Cart /></ShopLayout>} />
            <Route path="/shop/checkout" element={<ShopLayout><PlaceOrder /></ShopLayout>} />
            <Route path="/shop/contact" element={<ShopLayout><Contact /></ShopLayout>} />
            <Route path="/shop/order-tracker" element={<ShopLayout><OrderTracker /></ShopLayout>} />
            <Route path="/shop/about" element={<ShopLayout><About /></ShopLayout>} />
            
            {/* Customer Portal */}
            <Route path="/customer" element={<CustomerRoute><CustomerLayout><CustomerHome /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/home" element={<CustomerRoute><CustomerLayout><CustomerHome /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/medicines" element={<CustomerRoute><CustomerLayout><CustomerMedicines /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/orders" element={<CustomerRoute><CustomerLayout><CustomerOrders /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/chat" element={<CustomerRoute><CustomerLayout><CustomerChat /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/checkout" element={<CustomerRoute><CustomerLayout><CustomerCheckout /></CustomerLayout></CustomerRoute>} />
            <Route path="/customer/profile" element={<CustomerRoute><CustomerLayout><CustomerProfile /></CustomerLayout></CustomerRoute>} />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute role={1}><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/medicines" element={<ProtectedRoute role={1}><DashboardLayout><Medicines /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/batches" element={<ProtectedRoute role={1}><DashboardLayout><Batches /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/sales" element={<ProtectedRoute role={1}><DashboardLayout><Sales /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/customers" element={<ProtectedRoute role={1}><DashboardLayout><Customers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute role={1}><DashboardLayout><Orders /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute role={1}><DashboardLayout><Users /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute role={1}><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute role={1}><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/messages" element={<ProtectedRoute role={1}><DashboardLayout><ContactMessages /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/audit" element={<ProtectedRoute role={1}><DashboardLayout><AuditLog /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/chats" element={<ProtectedRoute role={1}><DashboardLayout><Chats /></DashboardLayout></ProtectedRoute>} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            {/* Catch-all */}
            <Route path="/" element={<Navigate to="/shop" />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
