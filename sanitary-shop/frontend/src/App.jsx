import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useApp } from './context.jsx';
import Navbar from './components/Navbar.jsx';
import Store from './pages/Store.jsx';
import ProductPage from './pages/ProductPage.jsx';
import Cart from './pages/Cart.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Auth from './pages/Auth.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Catalog from './admin/Catalog.jsx';
import Vendors from './admin/Vendors.jsx';
import Payments from './admin/Payments.jsx';
import AdminOrders from './admin/AdminOrders.jsx';

function Shell() { return (<><Navbar /><main className="wrap"><Outlet /></main><footer className="foot">Sanitary Shop. Pipes, fittings, ceramics and taps. Cash on delivery.</footer></>); }
function Need({ admin, children }) {
  const { user, ready } = useApp();
  if (!ready) return <div className="center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Store />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Need><MyOrders /></Need>} />
        <Route path="/login" element={<Auth />} />
      </Route>
      <Route path="/admin" element={<Need admin><AdminLayout /></Need>}>
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="payments" element={<Payments />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
