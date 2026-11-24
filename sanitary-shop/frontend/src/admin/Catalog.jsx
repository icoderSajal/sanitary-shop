import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, rs } from '../api';
import { Modal, Field } from '../components/ui.jsx';

const blankP = { name: '', category: '', brand: '', image: '', description: '', purchaseRate: '', saleRate: '', mrp: '', stock: 0, lowStockLimit: 10, weightKg: 0, unit: 'pcs', active: true };

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [pf, setPf] = useState(null);
  const [cf, setCf] = useState(null);
  const [q, setQ] = useState('');

  const load = () => {
    api.get('/products/admin/all').then((r) => setProducts(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get('/categories').then((r) => setCats(r.data)).catch((e) => toast.error(errMsg(e)));
  };
  useEffect(load, []);

  const saveP = async (e) => {
    e.preventDefault();
    const body = { ...pf, category: pf.category?._id || pf.category };
    ['purchaseRate', 'saleRate', 'mrp', 'stock', 'lowStockLimit', 'weightKg'].forEach((k) => { body[k] = Number(body[k]) || 0; });
    try {
      pf._id ? await api.put(`/products/${pf._id}`, body) : await api.post('/products', body);
      toast.success('Product saved'); setPf(null); load();
    } catch (x) { toast.error(errMsg(x)); }
  };
  const delP = async (p) => { if (window.confirm(`Delete ${p.name}?`)) { try { await api.delete(`/products/${p._id}`); toast.success('Product deleted'); load(); } catch (x) { toast.error(errMsg(x)); } } };

  const saveC = async (e) => {
    e.preventDefault();
    try {
      cf._id ? await api.put(`/categories/${cf._id}`, cf) : await api.post('/categories', cf);
      toast.success('Category saved'); setCf(null); load();
    } catch (x) { toast.error(errMsg(x)); }
  };
  const delC = async (c) => { if (window.confirm(`Delete category ${c.name}?`)) { try { await api.delete(`/categories/${c._id}`); toast.success('Category deleted'); load(); } catch (x) { toast.error(errMsg(x)); } } };

  const up = (k) => (e) => setPf({ ...pf, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const margin = pf ? (Number(pf.saleRate) || 0) - (Number(pf.purchaseRate) || 0) : 0;
  const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="row between"><h2>Categories</h2><button className="btn sm" onClick={() => setCf({ name: '', description: '' })}><Plus size={16} /> Add category</button></div>
      <div className="catrow">
        {cats.map((c) => (
          <div key={c._id} className="card cat"><b>{c.name}</b><small>{c.productCount} products</small>
            <span><button className="icon" onClick={() => setCf(c)} aria-label="Edit"><Pencil size={15} /></button><button className="icon" onClick={() => delC(c)} aria-label="Delete"><Trash2 size={15} /></button></span>
          </div>
        ))}
        {cats.length === 0 && <small className="muted">Create your first category to start adding products.</small>}
      </div>

      <div className="row between"><h2>Products</h2>
        <div className="row"><input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn sm" disabled={!cats.length} onClick={() => setPf({ ...blankP, category: cats[0]?._id })}><Plus size={16} /> Add product</button></div></div>
      <div className="card tbl"><table>
        <thead><tr><th>Product</th><th>Category</th><th>Buy</th><th>Sell</th><th>Margin</th><th>Stock</th><th>Weight</th><th></th></tr></thead>
        <tbody>{shown.map((p) => (
          <tr key={p._id} className={p.active ? '' : 'dim'}>
            <td><b>{p.name}</b><small>{p.brand}{p.active ? '' : ' · hidden'}</small></td><td>{p.category?.name}</td>
            <td>{rs(p.purchaseRate)}</td><td>{rs(p.saleRate)}</td><td>{rs(p.saleRate - p.purchaseRate)}</td>
            <td className={p.stock <= p.lowStockLimit ? 'bad' : ''}>{p.stock}</td><td>{p.weightKg || '-'}</td>
            <td className="act"><button className="icon" onClick={() => setPf(p)} aria-label="Edit"><Pencil size={16} /></button><button className="icon" onClick={() => delP(p)} aria-label="Delete"><Trash2 size={16} /></button></td>
          </tr>))}
          {shown.length === 0 && <tr><td colSpan="8" className="muted">No products found</td></tr>}
        </tbody></table></div>

      {cf && <Modal title={cf._id ? 'Edit category' : 'New category'} onClose={() => setCf(null)}>
        <form onSubmit={saveC}>
          <Field label="Category name"><input required value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} /></Field>
          <Field label="Description"><input value={cf.description || ''} onChange={(e) => setCf({ ...cf, description: e.target.value })} /></Field>
          <button className="btn">Save category</button>
        </form></Modal>}

      {pf && <Modal wide title={pf._id ? 'Edit product' : 'New product'} onClose={() => setPf(null)}>
        <form onSubmit={saveP}>
          <div className="two">
            <Field label="Product name"><input required value={pf.name} onChange={up('name')} /></Field>
            <Field label="Category"><select required value={pf.category?._id || pf.category} onChange={up('category')}>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
          </div>
          <div className="two">
            <Field label="Brand"><input value={pf.brand} onChange={up('brand')} /></Field>
            <Field label="Image link (https://…)"><input value={pf.image} onChange={up('image')} /></Field>
          </div>
          <div className="two three">
            <Field label="Purchase rate (₹)"><input type="number" min="0" step="any" value={pf.purchaseRate} onChange={up('purchaseRate')} /></Field>
            <Field label="Sale rate (₹)"><input type="number" min="0" step="any" required value={pf.saleRate} onChange={up('saleRate')} /></Field>
            <Field label="MRP (₹)"><input type="number" min="0" step="any" value={pf.mrp} onChange={up('mrp')} /></Field>
          </div>
          <p className={margin < 0 ? 'bad' : 'ok-t'}>Margin per unit: {rs(margin)}</p>
          <div className="two three">
            <Field label="Stock"><input type="number" min="0" value={pf.stock} onChange={up('stock')} /></Field>
            <Field label="Low stock alert at"><input type="number" min="0" value={pf.lowStockLimit} onChange={up('lowStockLimit')} /></Field>
            <Field label="Weight in kg (0 if none)"><input type="number" min="0" step="any" value={pf.weightKg} onChange={up('weightKg')} /></Field>
          </div>
          <div className="two">
            <Field label="Unit"><input value={pf.unit} onChange={up('unit')} /></Field>
            <label className="check"><input type="checkbox" checked={pf.active} onChange={up('active')} /> Show in store</label>
          </div>
          <Field label="Description"><textarea rows="3" value={pf.description} onChange={up('description')} /></Field>
          <button className="btn">Save product</button>
        </form></Modal>}
    </>
  );
}
