import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, ShoppingBag, Users, Boxes, HandCoins, Truck, TrendingUp, ArrowDownLeft } from 'lucide-react';
import api, { errMsg, rs } from '../api';
import { StatusPill } from '../components/ui.jsx';

const COLORS = ['#1F6F7A', '#B7832F', '#10303A', '#7FB5B0', '#C8553D', '#8A8F5A', '#5B6C8F'];

const Stat = ({ icon: I, label, value, tone }) => (
  <div className={'stat ' + (tone || '')}><I size={20} /><div><small>{label}</small><strong>{value}</strong></div></div>
);

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/dashboard').then((r) => setD(r.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (err) return <div className="alert">{err}</div>;
  if (!d) return <div className="center">Loading dashboard…</div>;
  const tip = { formatter: (v) => rs(v) };
  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        <Stat icon={IndianRupee} label="Sales (all time)" value={rs(d.revenue)} />
        <Stat icon={TrendingUp} label="Estimated profit" value={rs(d.profit)} tone="ok" />
        <Stat icon={ShoppingBag} label="Orders" value={d.orders} />
        <Stat icon={HandCoins} label="COD to collect" value={rs(d.pendingCod)} tone="warn" />
        <Stat icon={ArrowDownLeft} label="Payments received" value={rs(d.received)} />
        <Stat icon={Truck} label="Owed to vendors" value={rs(d.vendorDue)} tone="warn" />
        <Stat icon={Users} label="Customers" value={d.customers} />
        <Stat icon={Boxes} label="Products" value={d.products} />
      </div>

      <div className="charts">
        <div className="card pad wide2">
          <h4>Sales, last 30 days</h4>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d.salesByDay}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1F6F7A" stopOpacity={0.5} /><stop offset="100%" stopColor="#1F6F7A" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} /><YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip {...tip} /><Area type="monotone" dataKey="sales" stroke="#1F6F7A" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card pad">
          <h4>Sales by category</h4>
          {d.categorySales.length === 0 ? <small className="muted">No sales yet</small> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={d.categorySales} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {d.categorySales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip {...tip} /></PieChart>
            </ResponsiveContainer>
          )}
          <div className="legend">{d.categorySales.map((c, i) => <span key={c.name}><i style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>)}</div>
        </div>
        <div className="card pad">
          <h4>Monthly sales</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.salesByMonth}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={50} /><Tooltip {...tip} /><Bar dataKey="sales" fill="#B7832F" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card pad">
          <h4>Best sellers</h4>
          {d.topProducts.length === 0 && <small className="muted">No sales yet</small>}
          {d.topProducts.map((t) => <div key={t.name} className="row between li"><span>{t.name}</span><b>{t.qty} sold</b></div>)}
        </div>
        <div className="card pad">
          <h4>Low stock</h4>
          {d.lowStock.length === 0 && <small className="muted">Everything is well stocked</small>}
          {d.lowStock.map((p) => <div key={p._id} className="row between li"><span>{p.name}</span><b className={p.stock === 0 ? 'bad' : 'warn-t'}>{p.stock} left</b></div>)}
        </div>
        <div className="card pad">
          <h4>Orders by status</h4>
          {d.statuses.length === 0 && <small className="muted">No orders yet</small>}
          {d.statuses.map((s) => <div key={s.status} className="row between li"><StatusPill s={s.status} /><b>{s.n}</b></div>)}
        </div>
      </div>
    </>
  );
}
