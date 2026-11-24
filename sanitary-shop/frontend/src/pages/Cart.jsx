import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, rs } from '../api';
import { useApp } from '../context.jsx';
import { Field, Empty } from '../components/ui.jsx';

export default function Cart() {
  const { cart, setQty, removeItem, clearCart, user } = useApp();
  const nav = useNavigate();
  const [addr, setAddr] = useState({ name: user?.name || '', phone: user?.phone || '', line: '', city: '', state: '', pincode: '' });
  const [geo, setGeo] = useState(null);
  const [km, setKm] = useState('');
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const items = cart.map((c) => ({ product: c._id, qty: c.qty }));
  const body = { items, distanceKm: km, ...(geo || {}) };

  useEffect(() => {
    if (!cart.length) { setQuote(null); return; }
    const t = setTimeout(() => {
      api.post('/orders/quote', body).then((r) => setQuote(r.data)).catch((e) => { setQuote(null); toast.error(errMsg(e)); });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [cart, km, geo]);

  const locate = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported here. Enter the distance in km.');
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success('Location captured'); },
      () => toast.error('Location blocked. Enter the distance in km instead.'));
  };

  const place = async (e) => {
    e.preventDefault();
    if (!user) { toast('Log in to place your order'); return nav('/login'); }
    setBusy(true);
    try {
      await api.post('/orders', { ...body, address: addr, note });
      clearCart(); toast.success('Order placed. Pay cash on delivery.'); nav('/orders');
    } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); }
  };

  if (!cart.length) return <Empty text={<>Your cart is empty. <Link to="/">Browse products</Link></>} />;
  const up = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });
  return (
    <div className="checkout">
      <section>
        <h2>Your cart</h2>
        {cart.map((i) => (
          <div key={i._id} className="card line">
            <div className="mini">{i.image ? <img src={i.image} alt="" /> : <span className="ph">{i.name.slice(0, 2)}</span>}</div>
            <div className="grow"><b>{i.name}</b><small className="muted">{rs(i.saleRate)} each{i.weightKg > 0 ? ` · ${i.weightKg} kg` : ''}</small></div>
            <input className="qty" type="number" min="1" max={i.stock} value={i.qty} onChange={(e) => setQty(i._id, +e.target.value || 1)} />
            <strong>{rs(i.saleRate * i.qty)}</strong>
            <button className="icon" onClick={() => removeItem(i._id)} aria-label="Remove"><Trash2 size={18} /></button>
          </div>
        ))}

        <form id="co" onSubmit={place} className="card pad">
          <h3>Delivery address</h3>
          <div className="two">
            <Field label="Name"><input required value={addr.name} onChange={up('name')} /></Field>
            <Field label="Mobile"><input required inputMode="numeric" value={addr.phone} onChange={up('phone')} /></Field>
          </div>
          <Field label="Address"><input required value={addr.line} onChange={up('line')} placeholder="House, street, landmark" /></Field>
          <div className="two three">
            <Field label="City"><input required value={addr.city} onChange={up('city')} /></Field>
            <Field label="State"><input value={addr.state} onChange={up('state')} /></Field>
            <Field label="Pincode"><input required inputMode="numeric" maxLength={6} value={addr.pincode} onChange={up('pincode')} /></Field>
          </div>
          <h3>Distance from shop</h3>
          <div className="two">
            <button type="button" className="btn ghost-b" onClick={locate}><MapPin size={16} /> {geo ? 'Location captured' : 'Use my location'}</button>
            <Field label="or enter distance (km)"><input type="number" min="0" value={km} onChange={(e) => { setKm(e.target.value); setGeo(null); }} /></Field>
          </div>
          <Field label="Note for the shop (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </form>
      </section>

      <aside className="card pad summary">
        <h3>Order summary</h3>
        {quote ? (
          <>
            <div className="row between"><span>Items</span><span>{rs(quote.itemsTotal)}</span></div>
            <div className="row between"><span>Weight</span><span>{quote.weightKg > 0 ? `${quote.weightKg} kg` : 'No weight'}</span></div>
            <div className="row between"><span>Distance</span><span>{quote.distanceKm} km</span></div>
            <div className="row between"><span>Shipping</span><span>{rs(quote.shipping)}</span></div>
            <small className="muted">Shipping = {rs(quote.rules.base)} base + {rs(quote.rules.perKm)}/km{quote.weightKg > 0 ? ` + ${rs(quote.rules.perKg)}/kg (grows with distance)` : ' (no weight, distance only)'}.</small>
            <div className="row between total"><span>Pay on delivery</span><strong>{rs(quote.total)}</strong></div>
          </>
        ) : <small className="muted">Calculating…</small>}
        <button form="co" className="btn" disabled={busy || !quote}>{busy ? 'Placing…' : 'Place order (Cash on delivery)'}</button>
      </aside>
    </div>
  );
}
