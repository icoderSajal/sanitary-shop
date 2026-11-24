const r = require('express').Router();
const { Order, User, Product, Payment, Purchase } = require('../models');
const { protect, admin, wrap } = require('../middleware/auth');
r.use(protect, admin);

const TZ = 'Asia/Kolkata';
const sum = (a) => (a[0] ? a[0].t : 0);

r.get('/', wrap(async (req, res) => {
  const valid = { status: { $ne: 'cancelled' } };
  const since30 = new Date(Date.now() - 30 * 864e5), since6m = new Date(Date.now() - 183 * 864e5);
  const grp = (id, extra) => [{ $group: { _id: id, ...extra } }];
  const [rev, customers, products, lowStock, pend, pin, pout, billed, vpaid, byDay, byMonth, byCat, top, statuses, profit] = await Promise.all([
    Order.aggregate([{ $match: valid }, ...grp(null, { t: { $sum: '$total' }, n: { $sum: 1 } })]),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Product.find({ $expr: { $lte: ['$stock', '$lowStockLimit'] } }).select('name stock lowStockLimit').sort('stock').limit(8),
    Order.aggregate([{ $match: { ...valid, paymentStatus: 'pending' } }, ...grp(null, { t: { $sum: '$total' } })]),
    Payment.aggregate([{ $match: { type: 'in' } }, ...grp(null, { t: { $sum: '$amount' } })]),
    Payment.aggregate([{ $match: { type: 'out' } }, ...grp(null, { t: { $sum: '$amount' } })]),
    Purchase.aggregate(grp(null, { t: { $sum: '$total' } })),
    Payment.aggregate([{ $match: { type: 'out', party: 'vendor' } }, ...grp(null, { t: { $sum: '$amount' } })]),
    Order.aggregate([{ $match: { ...valid, createdAt: { $gte: since30 } } }, ...grp({ $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, { sales: { $sum: '$total' }, orders: { $sum: 1 } })]),
    Order.aggregate([{ $match: { ...valid, createdAt: { $gte: since6m } } }, ...grp({ $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TZ } }, { sales: { $sum: '$total' } })]),
    Order.aggregate([{ $match: valid }, { $unwind: '$items' }, ...grp('$items.category', { value: { $sum: { $multiply: ['$items.price', '$items.qty'] } } })]),
    Order.aggregate([{ $match: valid }, { $unwind: '$items' }, ...grp('$items.name', { qty: { $sum: '$items.qty' }, value: { $sum: { $multiply: ['$items.price', '$items.qty'] } } }), { $sort: { qty: -1 } }, { $limit: 5 }]),
    Order.aggregate(grp('$status', { n: { $sum: 1 } })),
    Order.aggregate([{ $match: valid }, { $unwind: '$items' }, ...grp(null, { t: { $sum: { $multiply: [{ $subtract: ['$items.price', '$items.cost'] }, '$items.qty'] } } })]),
  ]);

  const dMap = new Map(byDay.map((d) => [d._id, d]));
  const salesByDay = Array.from({ length: 30 }, (_, i) => {
    const key = new Date(Date.now() - (29 - i) * 864e5).toLocaleDateString('en-CA', { timeZone: TZ });
    const d = dMap.get(key);
    return { date: key.slice(5), sales: d ? d.sales : 0, orders: d ? d.orders : 0 };
  });
  const mMap = new Map(byMonth.map((m) => [m._id, m.sales]));
  const salesByMonth = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - (5 - i));
    const key = dt.toLocaleDateString('en-CA', { timeZone: TZ }).slice(0, 7);
    return { month: dt.toLocaleString('en-IN', { month: 'short', timeZone: TZ }), sales: mMap.get(key) || 0 };
  });

  res.json({
    revenue: sum(rev), orders: rev[0] ? rev[0].n : 0, customers, products,
    pendingCod: sum(pend), received: sum(pin), paidOut: sum(pout), vendorDue: sum(billed) - sum(vpaid), profit: sum(profit),
    lowStock, salesByDay, salesByMonth,
    categorySales: byCat.map((c) => ({ name: c._id || 'Other', value: c.value })),
    topProducts: top.map((t) => ({ name: t._id, qty: t.qty, value: t.value })),
    statuses: statuses.map((s) => ({ status: s._id, n: s.n })),
  });
}));
module.exports = r;
