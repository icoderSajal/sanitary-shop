import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!localStorage.getItem('token')) { setReady(true); return; }
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const login = (d) => { localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  const addToCart = (p, qty = 1) => setCart((c) => {
    const found = c.find((x) => x._id === p._id);
    const next = Math.min((found ? found.qty : 0) + qty, p.stock);
    const item = { _id: p._id, name: p.name, image: p.image, saleRate: p.saleRate, weightKg: p.weightKg, stock: p.stock, qty: next };
    return found ? c.map((x) => (x._id === p._id ? item : x)) : [...c, item];
  });
  const setQty = (id, qty) => setCart((c) => c.map((x) => (x._id === id ? { ...x, qty: Math.max(1, Math.min(qty, x.stock)) } : x)));
  const removeItem = (id) => setCart((c) => c.filter((x) => x._id !== id));
  const clearCart = () => setCart([]);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  return <Ctx.Provider value={{ user, ready, login, logout, cart, addToCart, setQty, removeItem, clearCart, count }}>{children}</Ctx.Provider>;
}
