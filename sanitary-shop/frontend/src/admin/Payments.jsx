import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, rs, dt } from '../api';
import { Modal, Field } from '../components/ui.jsx';

export default function Payments() {
  const [tab, setTab] = useState('in');
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [f, setF] = useState(null);

  const load = () => api.get('/payments', { params: { type: tab } }).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    api.get('/vendors').then((r) => setVendors(r.data)).catch(() => {});
    api.get('/orders', { params: { } }).then((r) => setOrders(r.data.filter((o) => o.paymentStatus === 'pending' && o.status !== 'cancelled'))).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try { await api.post('/payments', f); toast.success('Payment recorded'); setF(null); load(); }
    catch (x) { toast.error(errMsg(x)); }
  };
  const del = async (p) => { if (window.confirm('Delete this payment entry?')) { try { await api.delete(`/payments/${p._id}`); load(); } catch (x) { toast.error(errMsg(x)); } } };
  const sum = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <div className="row between"><h2>Payments</h2>
        <button className="btn sm" onClick={() => setF({ type: tab, amount: '', method: 'cash', note: '', vendor: vendors[0]?._id || '', order: '', customerName: '' })}><Plus size={16} /> {tab === 'in' ? 'Record received' : 'Record paid to vendor'}</button></div>
      <div className="tabs">
        <button className={tab === 'in' ? 'on' : ''} onClick={() => setTab('in')}>From customers</button>
        <button className={tab === 'out' ? 'on' : ''} onClick={() => setTab('out')}>To vendors</button>
      </div>
      <p className="muted">{tab === 'in' ? 'Total received' : 'Total paid'}: <b>{rs(sum)}</b> across {rows.length} entries</p>
      <div className="card tbl"><table>
        <thead><tr><th>Date</th><th>{tab === 'in' ? 'Customer' : 'Vendor'}</th><th>Reference</th><th>Method</th><th>Amount</th><th></th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p._id}><td>{dt(p.date)}</td><td>{tab === 'in' ? p.customerName || '-' : p.vendor?.name}</td><td>{p.order?.orderNo || p.note || '-'}</td><td>{p.method}</td><td><b>{rs(p.amount)}</b></td>
            <td className="act"><button className="icon" onClick={() => del(p)} aria-label="Delete"><Trash2 size={16} /></button></td></tr>))}
          {rows.length === 0 && <tr><td colSpan="6" className="muted">No payments recorded yet</td></tr>}
        </tbody></table></div>

      {f && <Modal title={f.type === 'in' ? 'Payment received' : 'Payment to vendor'} onClose={() => setF(null)}>
        <form onSubmit={save}>
          {f.type === 'out' ? (
            <Field label="Vendor"><select value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })}>{vendors.map((v) => <option key={v._id} value={v._id}>{v.name} (due {rs(v.due)})</option>)}</select></Field>
          ) : (
            <>
              <Field label="Against order (optional)"><select value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })}><option value="">Not linked to an order</option>{orders.map((o) => <option key={o._id} value={o._id}>{o.orderNo} · {o.address.name} · {rs(o.total)}</option>)}</select></Field>
              {!f.order && <Field label="Customer name"><input required value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></Field>}
            </>
          )}
          <div className="two">
            <Field label="Amount (₹)"><input type="number" required min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Method"><select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{['cash', 'upi', 'bank', 'cheque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          </div>
          <Field label="Note"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <button className="btn">Save payment</button>
        </form></Modal>}
    </>
  );
}
