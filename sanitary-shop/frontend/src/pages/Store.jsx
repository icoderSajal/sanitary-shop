import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api, { errMsg } from '../api';
import ProductCard from '../components/ProductCard.jsx';
import { Empty } from '../components/ui.jsx';

export default function Store() {
  const [cats, setCats] = useState([]);
  const [meta, setMeta] = useState({ brands: [], min: 0, max: 1000 });
  const [f, setF] = useState({ q: '', category: '', brand: [], minPrice: '', maxPrice: '', sort: 'new', page: 1 });
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCats(r.data)).catch(() => {});
    api.get('/products/meta/filters').then((r) => setMeta(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true); setError('');
      api.get('/products', { params: { ...f, brand: f.brand.join(','), limit: 12 } })
        .then((r) => setData(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  const set = (patch) => setF((s) => ({ ...s, page: 1, ...patch }));
  const toggleBrand = (b) => set({ brand: f.brand.includes(b) ? f.brand.filter((x) => x !== b) : [...f.brand, b] });
  const reset = () => setF({ q: '', category: '', brand: [], minPrice: '', maxPrice: '', sort: 'new', page: 1 });

  return (
    <>
      <section className="hero">
        <div>
          <h1>Everything behind the wall, sorted.</h1>
          <p>PVC, CPVC and UPVC pipes, fittings, ceramics and taps. Pay cash when it reaches your door.</p>
          <div className="search"><Search size={18} /><input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search elbow, wash basin, swan neck tap…" /></div>
        </div>
        <div className="chips">
          <button className={!f.category ? 'chip on' : 'chip'} onClick={() => set({ category: '' })}>All</button>
          {cats.map((c) => (
            <button key={c._id} className={f.category === c._id ? 'chip on' : 'chip'} onClick={() => set({ category: c._id })}>{c.name} <small>{c.productCount}</small></button>
          ))}
        </div>
      </section>
      <div className="pipe-bar" />

      <button className="btn ghost-b mobile-only" onClick={() => setOpen(!open)}><SlidersHorizontal size={16} /> Filters</button>
      <div className="shop">
        <aside className={'filters card' + (open ? ' open' : '')}>
          <h4>Price (₹)</h4>
          <div className="row">
            <input type="number" min="0" placeholder={String(meta.min)} value={f.minPrice} onChange={(e) => set({ minPrice: e.target.value })} />
            <input type="number" min="0" placeholder={String(meta.max)} value={f.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} />
          </div>
          <h4>Brand</h4>
          {meta.brands.length === 0 && <small>No brands yet</small>}
          {meta.brands.map((b) => (
            <label key={b} className="check"><input type="checkbox" checked={f.brand.includes(b)} onChange={() => toggleBrand(b)} /> {b}</label>
          ))}
          <h4>Sort by</h4>
          <select value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="new">Newest</option><option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option><option value="rating">Best rated</option>
          </select>
          <button className="ghost" onClick={reset}>Clear all filters</button>
        </aside>

        <section>
          <p className="muted">{loading ? 'Loading products…' : `${data.total} products`}</p>
          {error && <div className="alert">{error}</div>}
          {!loading && !error && data.items.length === 0 && <Empty text="No products match these filters. Try clearing the price or brand." />}
          <div className="grid">{data.items.map((p) => <ProductCard key={p._id} p={p} />)}</div>
          {data.pages > 1 && (
            <div className="pager">
              <button className="ghost" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Previous</button>
              <span>Page {f.page} of {data.pages}</span>
              <button className="ghost" disabled={f.page >= data.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next</button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
