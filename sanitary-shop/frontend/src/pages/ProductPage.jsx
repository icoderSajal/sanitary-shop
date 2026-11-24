import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, rs, dt } from '../api';
import { useApp } from '../context.jsx';
import { Stars, Empty } from '../components/ui.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, user } = useApp();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');
  const [rv, setRv] = useState({ rating: 5, comment: '' });

  const load = () => {
    api.get(`/products/${id}`).then((r) => setP(r.data)).catch((e) => setErr(errMsg(e)));
    api.get(`/reviews/product/${id}`).then((r) => setReviews(r.data)).catch(() => {});
  };
  useEffect(load, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/reviews', { product: id, ...rv }); toast.success('Thanks for your review'); setRv({ rating: 5, comment: '' }); load(); }
    catch (x) { toast.error(errMsg(x)); }
  };

  if (err) return <div className="alert">{err} <Link to="/">Back to shop</Link></div>;
  if (!p) return <div className="center">Loading…</div>;
  return (
    <div className="detail">
      <div className="card big-thumb">{p.image ? <img src={p.image} alt={p.name} /> : <span className="ph">{p.name.slice(0, 2)}</span>}</div>
      <div>
        <small className="muted">{p.brand} · {p.category?.name}</small>
        <h1>{p.name}</h1>
        <div className="row"><Stars value={p.rating} /><small>{p.rating || 'No'} rating · {p.numReviews} reviews</small></div>
        <p className="price"><strong>{rs(p.saleRate)}</strong> {p.mrp > p.saleRate && <s>{rs(p.mrp)}</s>} <small>per {p.unit}</small></p>
        <p>{p.description || 'No description added yet.'}</p>
        <ul className="facts">
          <li>Weight: {p.weightKg > 0 ? `${p.weightKg} kg per ${p.unit}` : 'Light item, shipping depends on distance'}</li>
          <li>{p.stock > 0 ? (p.stock <= p.lowStockLimit ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}</li>
          <li>Cash on delivery. Shipping is calculated at checkout.</li>
        </ul>
        <div className="row">
          <input className="qty" type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} />
          <button className="btn" disabled={p.stock <= 0} onClick={() => { addToCart(p, qty); toast.success('Added to cart'); }}>Add to cart</button>
        </div>
      </div>

      <section className="reviews">
        <h3>Quality reviews</h3>
        {user ? (
          <form className="card pad" onSubmit={submit}>
            <b>Rate this product</b>
            <Stars value={rv.rating} onChange={(n) => setRv({ ...rv, rating: n })} size={24} />
            <textarea rows="3" placeholder="How was the quality, finish and fit?" value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} />
            <button className="btn sm">Post review</button>
            <small className="muted">Reviews open after the product is delivered to you.</small>
          </form>
        ) : <p className="muted"><Link to="/login">Log in</Link> to review products you bought.</p>}
        {reviews.length === 0 ? <Empty text="No reviews yet. Be the first to share how it held up." /> :
          reviews.map((r) => (
            <div key={r._id} className="card pad"><div className="row between"><b>{r.userName}</b><small>{dt(r.createdAt)}</small></div><Stars value={r.rating} size={14} /><p>{r.comment}</p></div>
          ))}
      </section>
    </div>
  );
}
