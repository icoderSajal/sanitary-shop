import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Boxes, Truck, Wallet, ClipboardList, Store } from 'lucide-react';

const links = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/orders', 'Orders', ClipboardList],
  ['/admin/catalog', 'Products and categories', Boxes],
  ['/admin/vendors', 'Vendors and purchases', Truck],
  ['/admin/payments', 'Payments', Wallet],
];
export default function AdminLayout() {
  return (
    <div className="admin">
      <aside className="side">
        <Link to="/admin" className="brand light"><span className="brand-mark" />Sanitary<b>Shop</b></Link>
        <nav>{links.map(([to, t, I, end]) => <NavLink key={to} to={to} end={end}><I size={18} /> {t}</NavLink>)}</nav>
        <Link to="/" className="back"><Store size={16} /> View storefront</Link>
      </aside>
      <section className="admin-main"><Outlet /></section>
    </div>
  );
}
