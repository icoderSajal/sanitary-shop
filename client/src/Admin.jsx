import { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api, { err } from "./api";
import { inr, STATUS, useApp } from "./App";
const CATS = [
  "PVC Pipe",
  "CPVC Pipe",
  "UPVC Pipe",
  "Fittings",
  "Ceramics",
  "Taps",
  "Accessories",
];
const useLoad = (u, d = []) => {
  const [v, s] = useState(d);
  const load = () => api.get(u).then((r) => s(r.data));
  useEffect(() => {
    load();
  }, [u]);
  return [v, load];
};

export default function Admin() {
  const l = [
    ["", "Dashboard"],
    ["products", "Products"],
    ["stock", "Stock"],
    ["vendors", "Vendors & purchases"],
    ["orders", "Orders"],
    ["payments", "Payments"],
    ["reports", "Monthly report"],
  ];
  return (
    <div className="adm">
      <aside className="side">
        {l.map(([p, n]) => (
          <NavLink
            key={p}
            end={p === ""}
            to={"/admin/" + p}
            className={({ isActive }) => (isActive ? "on" : "")}
          >
            {n}
          </NavLink>
        ))}
      </aside>
      <main className="wrap" style={{ width: "100%" }}>
        <Routes>
          <Route index element={<Dash />} />
          <Route path="products" element={<Products />} />
          <Route path="stock" element={<Stock />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="orders" element={<Orders />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Report />} />
        </Routes>
      </main>
    </div>
  );
}
function Dash() {
  const [d] = useLoad("/admin/dashboard", {});
  const [low] = useLoad("/admin/low-stock");
  const S = (t, v) => (
    <div className="card stat">
      <span className="muted">{t}</span>
      <b>{v}</b>
    </div>
  );
  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        {S("Today's sales", inr(d.todaySales))}
        {S("Today's orders", d.todayOrders || 0)}
        {S("Pending orders", d.pending || 0)}
        {S("Cash in", inr(d.cashIn))}
        {S("Cash out", inr(d.cashOut))}
        {S("Low stock items", low.length)}
      </div>
      <h3>Low stock</h3>
      <div className="tbl">
        <table>
          <tbody>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Stock</th>
            </tr>
            {low.map((x, i) => (
              <tr key={i}>
                <td>{x.name}</td>
                <td>{x.size}</td>
                <td style={{ color: "var(--bad)", fontWeight: 700 }}>
                  {x.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
const blank = {
  name: "",
  category: CATS[0],
  brand: "",
  material: "",
  image: "",
  description: "",
  variants: [
    { size: "", price: 0, mrp: 0, stock: 0, lowStockLimit: 10, weightKg: 0.5 },
  ],
};
function Products() {
  const [list, load] = useLoad("/admin/products");
  const [f, setF] = useState(null);
  const { toast } = useApp();
  const save = async () => {
    try {
      f._id
        ? await api.put("/admin/products/" + f._id, f)
        : await api.post("/admin/products", f);
      setF(null);
      load();
      toast("Saved");
    } catch (e) {
      toast(err(e));
    }
  };
  const setV = (i, k, v) =>
    setF({
      ...f,
      variants: f.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)),
    });
  if (f)
    return (
      <div className="card">
        <h2>{f._id ? "Edit" : "New"} product</h2>
        <label>Name</label>
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <label>Category</label>
        <select
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
        >
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label>Brand</label>
        <input
          value={f.brand}
          onChange={(e) => setF({ ...f, brand: e.target.value })}
        />
        <label>Material</label>
        <input
          value={f.material}
          onChange={(e) => setF({ ...f, material: e.target.value })}
        />
        <label>Image URL</label>
        <input
          value={f.image}
          onChange={(e) => setF({ ...f, image: e.target.value })}
        />
        <h4>Sizes and prices</h4>
        {f.variants.map((v, i) => (
          <div
            key={i}
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
              marginBottom: 8,
            }}
          >
            {[
              ["size", "Size"],
              ["price", "Price"],
              ["mrp", "MRP"],
              ["stock", "Stock"],
              ["lowStockLimit", "Low limit"],
              ["weightKg", "Weight kg"],
            ].map(([k, l]) => (
              <div key={k}>
                <label>{l}</label>
                <input
                  value={v[k] ?? ""}
                  type={k === "size" ? "text" : "number"}
                  onChange={(e) =>
                    setV(i, k, k === "size" ? e.target.value : +e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        ))}
        <button
          className="btn ghost"
          onClick={() =>
            setF({ ...f, variants: [...f.variants, { ...blank.variants[0] }] })
          }
        >
          Add size
        </button>{" "}
        <button className="btn" onClick={save}>
          Save product
        </button>{" "}
        <button className="btn ghost" onClick={() => setF(null)}>
          Cancel
        </button>
      </div>
    );
  return (
    <>
      <div className="row" style={{ border: 0 }}>
        <h2>Products</h2>
        <button className="btn" onClick={() => setF(blank)}>
          Add product
        </button>
      </div>
      <div className="tbl">
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Sizes</th>
              <th></th>
            </tr>
            {list.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.variants.length}</td>
                <td>
                  <button className="btn ghost" onClick={() => setF(p)}>
                    Edit
                  </button>{" "}
                  <button
                    className="btn red"
                    onClick={async () => {
                      if (confirm("Delete?")) {
                        await api.delete("/admin/products/" + p._id);
                        load();
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Stock() {
  const [list, load] = useLoad("/admin/products");
  const { toast } = useApp();
  const adj = async (p, v) => {
    const q = prompt(`Add (+) or remove (-) stock for ${p.name} ${v.size}`);
    if (q) {
      await api.put("/admin/stock", {
        productId: p._id,
        variantId: v._id,
        qty: q,
      });
      load();
      toast("Stock updated");
    }
  };
  return (
    <>
      <h2>Stock</h2>
      <div className="tbl">
        <table>
          <tbody>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Stock</th>
              <th></th>
            </tr>
            {list.flatMap((p) =>
              p.variants.map((v) => (
                <tr key={v._id}>
                  <td>{p.name}</td>
                  <td>{v.size}</td>
                  <td
                    style={{
                      color: v.stock <= v.lowStockLimit ? "var(--bad)" : "",
                      fontWeight: 700,
                    }}
                  >
                    {v.stock}
                    {v.stock <= v.lowStockLimit && " (low)"}
                  </td>
                  <td>
                    <button className="btn ghost" onClick={() => adj(p, v)}>
                      Adjust
                    </button>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Vendors() {
  const [vs, lv] = useLoad("/admin/vendors"),
    [ps] = useLoad("/admin/products"),
    [pu, lp] = useLoad("/admin/purchases");
  const { toast } = useApp();
  const [v, setV] = useState({ name: "", phone: "" }),
    [b, setB] = useState({ vendor: "", invoiceNo: "", paid: 0, items: [] }),
    [it, setIt] = useState({ pv: "", qty: 1, costPrice: 0 });
  const addItem = () => {
    const [pid, vid] = it.pv.split("|");
    const p = ps.find((x) => x._id === pid);
    if (!p) return;
    setB({
      ...b,
      items: [
        ...b.items,
        {
          product: pid,
          variantId: vid,
          name: p.name + " " + p.variants.find((x) => x._id === vid).size,
          qty: +it.qty,
          costPrice: +it.costPrice,
        },
      ],
    });
  };
  const save = async () => {
    try {
      await api.post("/admin/purchases", b);
      setB({ vendor: "", invoiceNo: "", paid: 0, items: [] });
      lp();
      toast("Purchase saved, stock updated");
    } catch (e) {
      toast(err(e));
    }
  };
  return (
    <>
      <h2>Vendors</h2>
      <div className="card">
        <div className="grid">
          <input
            placeholder="Vendor name"
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
          <input
            placeholder="Phone"
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
          />
          <button
            className="btn"
            onClick={async () => {
              await api.post("/admin/vendors", v);
              setV({ name: "", phone: "" });
              lv();
            }}
          >
            Add vendor
          </button>
        </div>
      </div>
      <h2>New purchase</h2>
      <div className="card">
        <div className="grid">
          <select
            value={b.vendor}
            onChange={(e) => setB({ ...b, vendor: e.target.value })}
          >
            <option value="">Select vendor</option>
            {vs.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Invoice no"
            value={b.invoiceNo}
            onChange={(e) => setB({ ...b, invoiceNo: e.target.value })}
          />
          <input
            type="number"
            placeholder="Paid now"
            value={b.paid}
            onChange={(e) => setB({ ...b, paid: +e.target.value })}
          />
        </div>
        <div className="grid" style={{ marginTop: 10 }}>
          <select
            value={it.pv}
            onChange={(e) => setIt({ ...it, pv: e.target.value })}
          >
            <option value="">Select product and size</option>
            {ps.flatMap((p) =>
              p.variants.map((x) => (
                <option key={x._id} value={p._id + "|" + x._id}>
                  {p.name} {x.size}
                </option>
              )),
            )}
          </select>
          <input
            type="number"
            placeholder="Qty"
            value={it.qty}
            onChange={(e) => setIt({ ...it, qty: e.target.value })}
          />
          <input
            type="number"
            placeholder="Cost price"
            value={it.costPrice}
            onChange={(e) => setIt({ ...it, costPrice: e.target.value })}
          />
          <button className="btn alt" onClick={addItem}>
            Add item
          </button>
        </div>
        {b.items.map((i, k) => (
          <div className="row" key={k}>
            <span>
              {i.name} × {i.qty}
            </span>
            <b>{inr(i.qty * i.costPrice)}</b>
          </div>
        ))}
        <button
          className="btn"
          style={{ marginTop: 10 }}
          disabled={!b.vendor || !b.items.length}
          onClick={save}
        >
          Save purchase
        </button>
      </div>
      <h3>Recent purchases</h3>
      <div className="tbl">
        <table>
          <tbody>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Invoice</th>
              <th>Total</th>
              <th>Paid</th>
            </tr>
            {pu.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                <td>{p.vendor?.name}</td>
                <td>{p.invoiceNo}</td>
                <td>{inr(p.total)}</td>
                <td>{inr(p.paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Orders() {
  const [st, setSt] = useState("");
  const [l, load] = useLoad("/admin/orders" + (st ? "?status=" + st : ""));
  const { toast } = useApp();
  const set = async (id, s) => {
    await api.put(`/admin/orders/${id}/status`, { status: s });
    load();
    toast("Status updated, SMS sent");
  };
  return (
    <>
      <h2>Orders</h2>
      <div className="chips">
        {["", ...STATUS, "cancelled"].map((s) => (
          <span
            key={s}
            className={"chip " + (st === s && "on")}
            onClick={() => setSt(s)}
          >
            {s || "All"}
          </span>
        ))}
      </div>
      {l.map((o) => (
        <div className="card" key={o._id} style={{ marginBottom: 10 }}>
          <div className="row" style={{ border: 0 }}>
            <b>
              #{o.orderNo} · {o.address.name} · {o.address.phone}
            </b>
            <span className={"badge " + o.status}>{o.status}</span>
          </div>
          <div className="muted">
            {o.address.line1}, {o.address.city} {o.address.pincode} ·{" "}
            {o.distanceKm} km
          </div>
          {o.items.map((i, x) => (
            <div key={x}>
              {i.name} {i.size} × {i.qty}
            </div>
          ))}
          <p>
            <b>{inr(o.total)}</b> COD ({o.paymentStatus})
          </p>
          <select
            value={o.status}
            onChange={(e) => set(o._id, e.target.value)}
            style={{ maxWidth: 200 }}
          >
            {[...STATUS, "cancelled"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      ))}
    </>
  );
}
function Payments() {
  const [l, load] = useLoad("/admin/payments");
  const [f, setF] = useState({ type: "out", amount: "", party: "", note: "" });
  return (
    <>
      <h2>Payments in and out</h2>
      <div className="card">
        <div className="grid">
          <select
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value })}
          >
            <option value="in">Payment in</option>
            <option value="out">Payment out</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: +e.target.value })}
          />
          <input
            placeholder="Party"
            value={f.party}
            onChange={(e) => setF({ ...f, party: e.target.value })}
          />
          <input
            placeholder="Note"
            value={f.note}
            onChange={(e) => setF({ ...f, note: e.target.value })}
          />
          <button
            className="btn"
            onClick={async () => {
              await api.post("/admin/payments", f);
              load();
            }}
          >
            Add entry
          </button>
        </div>
      </div>
      <div className="tbl" style={{ marginTop: 14 }}>
        <table>
          <tbody>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Party</th>
              <th>Note</th>
              <th>Amount</th>
            </tr>
            {l.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.date).toLocaleDateString("en-IN")}</td>
                <td>
                  <span
                    className={
                      "badge " + (p.type === "in" ? "delivered" : "cancelled")
                    }
                  >
                    {p.type}
                  </span>
                </td>
                <td>{p.party}</td>
                <td>{p.note}</td>
                <td>{inr(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Report() {
  const n = new Date();
  const [m, setM] = useState(n.getMonth() + 1),
    [y, setY] = useState(n.getFullYear());
  const [r] = useLoad(`/admin/report?month=${m}&year=${y}`, {
    days: [],
    top: [],
  });
  return (
    <>
      <h2>Monthly report</h2>
      <div className="grid" style={{ maxWidth: 360 }}>
        <select value={m} onChange={(e) => setM(+e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {new Date(2000, i).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={y}
          onChange={(e) => setY(+e.target.value)}
        />
      </div>
      <div className="stats" style={{ marginTop: 14 }}>
        <div className="card stat">
          <span className="muted">Sales</span>
          <b>{inr(r.sales)}</b>
        </div>
        <div className="card stat">
          <span className="muted">Orders</span>
          <b>{r.orders || 0}</b>
        </div>
        <div className="card stat">
          <span className="muted">Purchases</span>
          <b>{inr(r.purchases)}</b>
        </div>
      </div>
      <div className="card" style={{ height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={r.days}>
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#1f8a9e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3>Top products</h3>
      <div className="tbl">
        <table>
          <tbody>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
            {r.top.map((t) => (
              <tr key={t._id}>
                <td>{t._id}</td>
                <td>{t.qty}</td>
                <td>{inr(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
