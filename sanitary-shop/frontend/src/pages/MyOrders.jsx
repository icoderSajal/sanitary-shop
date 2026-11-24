import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, rs, dt } from '../api';
import { Empty, StatusPill } from '../components/ui.jsx';

const STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const label = (s) => s.replace(/_/g, ' ');

export function Tracker({ order }) {
  if (order.status === 'cancelled') return <p className="alert">This order was cancelled.</p>;
  const at = STEPS.indexOf(order.status);
  return (
    <ol className="track">
      {STEPS.map((s, i) => {
        const h = order.history.find((x) => x.status === s);
        return (
          <li key={s} className={i <= at ? 'done' : ''}>
            <i /><b>{label(s)}</b><small>{h ? dt(h.at) : ''}</small>
          </li>
        );
      })}
    </ol>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const load = () => api.get('/orders/mine').then((r) => setOrders(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try { await api.put(`/orders/${id}/cancel`); toast.success('Order cancelled'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  if (!orders) return <div className="center">Loading…</div>;
  if (!orders.length) return <Empty text={<>No orders yet. <Link to="/">Start shopping</Link></>} />;
  return (
    <div>
      <h2>My orders</h2>
      {orders.map((o) => (
        <div key={o._id} className="card pad order">
          <div className="row between"><div><b>{o.orderNo}</b> <small className="muted">{dt(o.createdAt)}</small></div><StatusPill s={o.status} /></div>
          <Tracker order={o} />
          <div className="olines">
            {o.items.map((i, k) => (
              <div key={k} className="row between">
                <span>{i.qty} × {i.name}</span>
                <span>{rs(i.price * i.qty)} {o.status === 'delivered' && <Link to={`/product/${i.product}`} className="link">Rate quality</Link>}</span>
              </div>
            ))}
          </div>
          <div className="row between"><small>Shipping {rs(o.shipping)} · {o.paymentStatus === 'paid' ? 'Paid' : 'Pay cash on delivery'}</small><strong>{rs(o.total)}</strong></div>
          {['placed', 'confirmed'].includes(o.status) && <button className="ghost" onClick={() => cancel(o._id)}>Cancel order</button>}
        </div>
      ))}
    </div>
  );
}
