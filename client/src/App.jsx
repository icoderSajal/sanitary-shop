import { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import api, { err } from "./api"; import Admin from "./Admin";
const Ctx = createContext(); export const useApp = () => useContext(Ctx);
export const inr = n => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const CATS = ["PVC Pipe", "CPVC Pipe", "UPVC Pipe", "Fittings", "Ceramics", "Taps", "Accessories"];
export const STATUS = ["placed", "confirmed", "packed", "shipped", "delivered"];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [msg, setMsg] = useState("");
  useEffect(() => localStorage.setItem("cart", JSON.stringify(cart)), [cart]);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
  const login = d => { localStorage.setItem("token", d.token); localStorage.setItem("user", JSON.stringify(d.user)); setUser(d.user); };
  const logout = () => { localStorage.clear(); setUser(null); setCart([]); };
  const add = (p, v) => { setCart(c => { const k = c.find(i => i.variantId === v._id); return k ? c.map(i => i === k ? { ...i, qty: i.qty + 1 } : i) : [...c, { productId: p._id, variantId: v._id, name: p.name, size: v.size, price: v.price, qty: 1 }]; }); toast("Added to cart"); };
  return <Ctx.Provider value={{ user, login, logout, cart, setCart, add, toast }}>
    <header className="top"><div className="wrap"><Link to="/" className="logo">Sanitary<b>Shop</b></Link>
      <nav><Link to="/cart">Cart ({cart.reduce((s, i) => s + i.qty, 0)})</Link>
        {user ? <>{user.role === "admin" && <Link to="/admin">Admin</Link>}<Link to="/orders">My orders</Link><a href="#" onClick={e => { e.preventDefault(); logout(); }}>Logout</a></> : <Link to="/login">Login</Link>}</nav></div></header>
    <Routes><Route path="/" element={<Shop />} /><Route path="/login" element={<Login />} /><Route path="/cart" element={<Cart />} /><Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} /><Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
      <Route path="/admin/*" element={user?.role === "admin" ? <Admin /> : <Navigate to="/login" />} /></Routes>
    {msg && <div className="toast">{msg}</div>}
  </Ctx.Provider>;
}

function Shop() {
  const [list, setList] = useState([]), [cat, setCat] = useState(""), [q, setQ] = useState("");
  useEffect(() => { api.get("/products", { params: { category: cat, q } }).then(r => setList(r.data)); }, [cat, q]);
  return <><div className="hero"><div className="wrap"><h1>Pipes, fittings and bathroom fixtures</h1><p>PVC, CPVC, UPVC, ceramics and taps. Pay cash on delivery.</p></div></div>
    <div className="wrap"><input placeholder="Search products" value={q} onChange={e => setQ(e.target.value)} />
      <div className="chips"><span className={"chip " + (!cat && "on")} onClick={() => setCat("")}>All</span>{CATS.map(c => <span key={c} className={"chip " + (cat === c && "on")} onClick={() => setCat(c)}>{c}</span>)}</div>
      <div className="grid">{list.map(p => <Card key={p._id} p={p} />)}</div>{!list.length && <p className="muted">No products found.</p>}</div></>;
}
function Card({ p }) {
  const { add } = useApp(); const [i, setI] = useState(0); const v = p.variants[i];
  return <div className="card pc">{p.image ? <img src={p.image} alt={p.name} /> : <div className="ph">No image</div>}
    <h4 style={{ margin: "10px 0 2px" }}>{p.name}</h4><div className="muted">{p.brand} {p.material}</div>
    {v ? <><select value={i} onChange={e => setI(+e.target.value)} style={{ margin: "8px 0" }}>{p.variants.map((x, k) => <option key={x._id} value={k}>{x.size}</option>)}</select>
      <div><span className="price">{inr(v.price)}</span>{v.mrp > v.price && <span className="mrp">{inr(v.mrp)}</span>}</div>
      <button className="btn" style={{ width: "100%", marginTop: 8 }} disabled={v.stock < 1} onClick={() => add(p, v)}>{v.stock < 1 ? "Out of stock" : "Add to cart"}</button></> : null}</div>;
}
function Login() {
  const { login } = useApp(), nav = useNavigate(); const [reg, setReg] = useState(false), [f, setF] = useState({ name: "", phone: "", password: "" }), [e, setE] = useState("");
  const go = async () => { try { login((await api.post(reg ? "/auth/register" : "/auth/login", f)).data); nav("/"); } catch (x) { setE(err(x)); } };
  return <div className="wrap" style={{ maxWidth: 420 }}><div className="card"><h2>{reg ? "Create account" : "Login"}</h2>
    {reg && <><label>Name</label><input value={f.name} onChange={x => setF({ ...f, name: x.target.value })} /></>}
    <label>Mobile number</label><input maxLength={10} value={f.phone} onChange={x => setF({ ...f, phone: x.target.value })} />
    <label>Password</label><input type="password" value={f.password} onChange={x => setF({ ...f, password: x.target.value })} />
    {e && <p style={{ color: "var(--bad)" }}>{e}</p>}<button className="btn" style={{ width: "100%", marginTop: 14 }} onClick={go}>{reg ? "Register" : "Login"}</button>
    <p className="muted" style={{ cursor: "pointer" }} onClick={() => setReg(!reg)}>{reg ? "Have an account? Login" : "New here? Create an account"}</p></div></div>;
}
function Cart() {
  const { cart, setCart } = useApp(); const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const upd = (k, d) => setCart(cart.map(i => i.variantId === k ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  return <div className="wrap two"><div className="card"><h2>Your cart</h2>{!cart.length && <p className="muted">Your cart is empty.</p>}
    {cart.map(i => <div className="row" key={i.variantId}><div><b>{i.name}</b><div className="muted">{i.size} · {inr(i.price)}</div></div>
      <div><button className="btn ghost" onClick={() => upd(i.variantId, -1)}>-</button> {i.qty} <button className="btn ghost" onClick={() => upd(i.variantId, 1)}>+</button></div><b>{inr(i.price * i.qty)}</b></div>)}</div>
    <div className="card"><h3>Subtotal {inr(total)}</h3><p className="muted">Shipping is calculated at checkout from distance and weight.</p><Link to="/checkout"><button className="btn" style={{ width: "100%" }} disabled={!cart.length}>Go to checkout</button></Link></div></div>;
}
function Checkout() {
  const { cart, setCart, user, toast } = useApp(), nav = useNavigate(); const [a, setA] = useState({ name: user.name, phone: user.phone, line1: "", city: "", pincode: "" }), [s, setS] = useState(null), [e, setE] = useState(""), [busy, setBusy] = useState(false);
  const items = cart.map(({ productId, variantId, qty }) => ({ productId, variantId, qty }));
  useEffect(() => { setS(null); if (/^\d{6}$/.test(a.pincode)) api.post("/shipping", { items, pincode: a.pincode }).then(r => { setS(r.data); setE(""); }).catch(x => setE(err(x))); }, [a.pincode]);
  const place = async () => { setBusy(true); try { await api.post("/orders", { items, address: a }); setCart([]); toast("Order placed. SMS sent to your mobile."); nav("/orders"); } catch (x) { setE(err(x)); setBusy(false); } };
  const f = (k, l) => <><label>{l}</label><input value={a[k]} onChange={x => setA({ ...a, [k]: x.target.value })} /></>;
  return <div className="wrap two"><div className="card"><h2>Delivery address</h2>{f("name", "Full name")}{f("phone", "Mobile for SMS updates")}{f("line1", "Address")}{f("city", "City")}{f("pincode", "Pincode")}</div>
    <div className="card"><h3>Order summary</h3>{cart.map(i => <div className="row" key={i.variantId}><span>{i.name} {i.size} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}
      {s ? <><div className="row"><span>Subtotal</span><b>{inr(s.subtotal)}</b></div><div className="row"><span>Shipping ({s.distanceKm} km, {s.weight.toFixed(1)} kg)</span><b>{inr(s.shipping)}</b></div><div className="row"><span>Total (Cash on Delivery)</span><b className="price">{inr(s.subtotal + s.shipping)}</b></div></> : <p className="muted">Enter your pincode to see shipping.</p>}
      {e && <p style={{ color: "var(--bad)" }}>{e}</p>}<button className="btn" style={{ width: "100%" }} disabled={!s || busy || !a.line1 || !a.city} onClick={place}>Place order (COD)</button></div></div>;
}
function Orders() {
  const [l, setL] = useState([]); useEffect(() => { api.get("/orders/mine").then(r => setL(r.data)); }, []);
  return <div className="wrap"><h2>My orders</h2>{!l.length && <p className="muted">No orders yet.</p>}{l.map(o => { const k = STATUS.indexOf(o.status); return <div className="card" key={o._id} style={{ marginBottom: 12 }}>
    <div className="row" style={{ border: 0 }}><b>Order #{o.orderNo}</b><span className={"badge " + o.status}>{o.status}</span></div>
    {o.status !== "cancelled" && <><div className="steps">{STATUS.map((s, i) => <i key={s} className={i <= k ? "d" : ""} />)}</div><div className="muted">{STATUS.join(" → ")}</div></>}
    {o.items.map((i, x) => <div key={x} className="muted">{i.name} {i.size} × {i.qty}</div>)}<p>Total {inr(o.total)} (incl. shipping {inr(o.shipping)}), Cash on Delivery</p></div>; })}</div>;
}
