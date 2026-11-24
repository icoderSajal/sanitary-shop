import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context.jsx';
import { rs } from '../api';
import { Stars } from './ui.jsx';

export default function ProductCard({ p }) {
  const { addToCart } = useApp();
  const out = p.stock <= 0;
  const off = p.mrp > p.saleRate ? Math.round(((p.mrp - p.saleRate) / p.mrp) * 100) : 0;
  return (
    <article className="card prod">
      <Link to={`/product/${p._id}`} className="thumb">
        {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span className="ph">{p.name.slice(0, 2)}</span>}
        {off > 0 && <em className="off">{off}% off</em>}
      </Link>
      <div className="prod-b">
        <small>{p.brand} · {p.category?.name}</small>
        <Link to={`/product/${p._id}`}><h4>{p.name}</h4></Link>
        <div className="row"><Stars value={p.rating} size={14} /><small>({p.numReviews})</small></div>
        <div className="row between">
          <div><strong>{rs(p.saleRate)}</strong>{p.mrp > p.saleRate && <s>{rs(p.mrp)}</s>}</div>
          <button className="btn sm" disabled={out} onClick={() => { addToCart(p); toast.success('Added to cart'); }}>
            <ShoppingCart size={15} /> {out ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
