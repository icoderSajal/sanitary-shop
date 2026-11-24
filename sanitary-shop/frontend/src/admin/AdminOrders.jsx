import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, rs, dt } from '../api';
import { StatusPill, Modal } from '../components/ui.jsx';
import { Tracker } from '../pages/MyOrders.jsx';

const NEXT = { placed: 'confirmed', confirmed: 'packed', packed: 'shipped', shipped: 'out_for_delivery', out_for_delivery: 'delivered' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [view, setView] = useState(null);

  const load = () => api.get('/orders', { params: { status } }).then((r) => setOrders(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [status]);

  const move = async (o, s) => {
    try { const { data } = await api.put(`/orders/${o._id}/status`, { status: s }); toast.success(`Order ${s.replace(/_/g, ' ')}`); setView(null); load(); return data; }
    catch (x) { toast.error(errMsg(x)); }
  };

  return (
    <>
      <div className="row between"><h2>Orders</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>
          {['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></div>
      <div className="card tbl"><table>
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o._id}>
            <td><b>{o.orderNo}</b><small>{dt(o.createdAt)}</small></td>
            <td>{o.address.name}<small>{o.address.phone} · {o.address.city}</small></td>
            <td>{rs(o.total)}<small>ship {rs(o.shipping)} · {o.distanceKm} km</small></td>
            <td><span className={'pill ' + (o.paymentStatus === 'paid' ? 'delivered' : 'placed')}>{o.paymentStatus === 'paid' ? 'paid' : 'COD pending'}</span></td>
            <td><StatusPill s={o.status} /></td>
            <td className="act">
              <button className="ghost" onClick={() => setView(o)}>Details</button>
              {NEXT[o.status] && <button className="btn sm" onClick={() => move(o, NEXT[o.status])}>Mark {NEXT[o.status].replace(/_/g, ' ')}</button>}
            </td>
          </tr>))}
          {orders.length === 0 && <tr><td colSpan="6" className="muted">No orders found</td></tr>}
        </tbody></table></div>

      {view && <Modal wide title={`Order ${view.orderNo}`} onClose={() => setView(null)}>
        <Tracker order={view} />
        <p><b>{view.address.name}</b>, {view.address.phone}<br />{view.address.line}, {view.address.city} {view.address.state} {view.address.pincode}</p>
        {view.note && <p className="muted">Note: {view.note}</p>}
        {view.items.map((i, k) => <div key={k} className="row between li"><span>{i.qty} × {i.name}</span><span>{rs(i.qty * i.price)}</span></div>)}
        <div className="row between li"><span>Shipping ({view.distanceKm} km, {view.weightKg} kg)</span><span>{rs(view.shipping)}</span></div>
        <div className="row between li"><b>Total (COD)</b><b>{rs(view.total)}</b></div>
        {!['delivered', 'cancelled'].includes(view.status) && <button className="ghost bad" onClick={() => window.confirm('Cancel this order and return stock?') && move(view, 'cancelled')}>Cancel order</button>}
      </Modal>}
    </>
  );
}
