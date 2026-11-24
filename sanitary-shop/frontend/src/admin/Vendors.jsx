import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, rs, dt } from '../api';
import { Modal, Field } from '../components/ui.jsx';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [vf, setVf] = useState(null);
  const [pf, setPf] = useState(null);

  const load = () => {
    api.get('/vendors').then((r) => setVendors(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get('/purchases').then((r) => setPurchases(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get('/products/admin/all').then((r) => setProducts(r.data)).catch(() => {});
  };
  useEffect(load, []);

  const saveV = async (e) => {
    e.preventDefault();
    try { vf._id ? await api.put(`/vendors/${vf._id}`, vf) : await api.post('/vendors', vf); toast.success('Vendor saved'); setVf(null); load(); }
    catch (x) { toast.error(errMsg(x)); }
  };
  const delV = async (v) => { if (window.confirm(`Delete ${v.name}?`)) { try { await api.delete(`/vendors/${v._id}`); load(); } catch (x) { toast.error(errMsg(x)); } } };

  const newPurchase = () => setPf({ vendor: vendors[0]?._id || '', items: [{ product: products[0]?._id || '', qty: 1, rate: products[0]?.purchaseRate || 0 }], paidNow: 0, method: 'cash', note: '' });
  const setItem = (i, patch) => setPf({ ...pf, items: pf.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const pickProduct = (i, id) => setItem(i, { product: id, rate: products.find((p) => p._id === id)?.purchaseRate || 0 });
  const total = pf ? pf.items.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.rate) || 0), 0) : 0;

  const savePurchase = async (e) => {
    e.preventDefault();
    try { await api.post('/purchases', pf); toast.success('Purchase recorded, stock updated'); setPf(null); load(); }
    catch (x) { toast.error(errMsg(x)); }
  };
  const delPurchase = async (p) => { if (window.confirm('Delete this purchase? Stock will be reduced again.')) { try { await api.delete(`/purchases/${p._id}`); load(); } catch (x) { toast.error(errMsg(x)); } } };

  return (
    <>
      <div className="row between"><h2>Vendors</h2><button className="btn sm" onClick={() => setVf({ name: '', phone: '', address: '' })}><Plus size={16} /> Add vendor</button></div>
      <div className="card tbl"><table>
        <thead><tr><th>Vendor</th><th>Phone</th><th>Billed</th><th>Paid</th><th>Due</th><th></th></tr></thead>
        <tbody>{vendors.map((v) => (
          <tr key={v._id}><td><b>{v.name}</b><small>{v.address}</small></td><td>{v.phone}</td><td>{rs(v.billed)}</td><td>{rs(v.paid)}</td><td className={v.due > 0 ? 'bad' : 'ok-t'}>{rs(v.due)}</td>
            <td className="act"><button className="icon" onClick={() => setVf(v)} aria-label="Edit"><Pencil size={16} /></button><button className="icon" onClick={() => delV(v)} aria-label="Delete"><Trash2 size={16} /></button></td></tr>))}
          {vendors.length === 0 && <tr><td colSpan="6" className="muted">Add a vendor before recording purchases</td></tr>}
        </tbody></table></div>

      <div className="row between"><h2>Purchases from vendors</h2><button className="btn sm" disabled={!vendors.length || !products.length} onClick={newPurchase}><Plus size={16} /> Record purchase</button></div>
      <div className="card tbl"><table>
        <thead><tr><th>Date</th><th>Vendor</th><th>Items</th><th>Total</th><th></th></tr></thead>
        <tbody>{purchases.map((p) => (
          <tr key={p._id}><td>{dt(p.date)}</td><td>{p.vendor?.name}</td><td>{p.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</td><td>{rs(p.total)}</td>
            <td className="act"><button className="icon" onClick={() => delPurchase(p)} aria-label="Delete"><Trash2 size={16} /></button></td></tr>))}
          {purchases.length === 0 && <tr><td colSpan="5" className="muted">No purchases recorded yet</td></tr>}
        </tbody></table></div>

      {vf && <Modal title={vf._id ? 'Edit vendor' : 'New vendor'} onClose={() => setVf(null)}>
        <form onSubmit={saveV}>
          <Field label="Vendor name"><input required value={vf.name} onChange={(e) => setVf({ ...vf, name: e.target.value })} /></Field>
          <Field label="Phone"><input value={vf.phone} onChange={(e) => setVf({ ...vf, phone: e.target.value })} /></Field>
          <Field label="Address"><input value={vf.address} onChange={(e) => setVf({ ...vf, address: e.target.value })} /></Field>
          <button className="btn">Save vendor</button>
        </form></Modal>}

      {pf && <Modal wide title="Record purchase" onClose={() => setPf(null)}>
        <form onSubmit={savePurchase}>
          <Field label="Vendor"><select value={pf.vendor} onChange={(e) => setPf({ ...pf, vendor: e.target.value })}>{vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}</select></Field>
          {pf.items.map((it, i) => (
            <div key={i} className="two three">
              <Field label="Product"><select value={it.product} onChange={(e) => pickProduct(i, e.target.value)}>{products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></Field>
              <Field label="Quantity"><input type="number" min="1" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} /></Field>
              <Field label="Purchase rate (₹)"><input type="number" min="0" step="any" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} /></Field>
            </div>
          ))}
          <button type="button" className="ghost" onClick={() => setPf({ ...pf, items: [...pf.items, { product: products[0]._id, qty: 1, rate: products[0].purchaseRate }] })}>+ Add another item</button>
          <div className="two three">
            <Field label="Paid now (₹)"><input type="number" min="0" value={pf.paidNow} onChange={(e) => setPf({ ...pf, paidNow: e.target.value })} /></Field>
            <Field label="Method"><select value={pf.method} onChange={(e) => setPf({ ...pf, method: e.target.value })}>{['cash', 'upi', 'bank', 'cheque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Note"><input value={pf.note} onChange={(e) => setPf({ ...pf, note: e.target.value })} /></Field>
          </div>
          <p><b>Total {rs(total)}</b> · Balance due {rs(total - (Number(pf.paidNow) || 0))}</p>
          <button className="btn">Save purchase</button>
        </form></Modal>}
    </>
  );
}
