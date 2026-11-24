import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useApp } from '../context.jsx';

export default function Navbar() {
  const { user, logout, count } = useApp();
  const nav = useNavigate();
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link to="/" className="brand"><span className="brand-mark" />Sanitary<b>Shop</b></Link>
        <nav className="nav-links">
          <NavLink to="/" end>Shop</NavLink>
          {user && <NavLink to="/orders"><Package size={16} /> My orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin"><LayoutDashboard size={16} /> Admin</NavLink>}
        </nav>
        <div className="nav-right">
          <Link to="/cart" className="cart-btn" aria-label="Cart"><ShoppingCart size={20} />{count > 0 && <span className="badge">{count}</span>}</Link>
          {user ? (
            <button className="ghost" onClick={() => { logout(); nav('/'); }}><LogOut size={16} /> {user.name.split(' ')[0]}</button>
          ) : (
            <Link to="/login" className="btn sm"><User size={16} /> Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
