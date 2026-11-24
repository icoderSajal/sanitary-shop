const r = require('express').Router();
const { Purchase, Product, Payment, Vendor } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');
r.use(protect, admin);

r.get('/', wrap(async (req, res) => {
  res.json(await Purchase.find().populate('vendor', 'name').sort('-date').limit(300));
}));

r.post('/', wrap(async (req, res) => {
  const { vendor, items, paidNow = 0, method = 'cash', note = '', date } = req.body;
  if (!(await Vendor.exists({ _id: vendor }))) throw fail('Select a vendor');
  if (!Array.isArray(items) || !items.length) throw fail('Add at least one item');
  const lines = [];
  for (const it of items) {
    const qty = Math.floor(+it.qty), rate = +it.rate;
    if (!(qty > 0) || !(rate >= 0)) throw fail('Quantity and rate must be valid numbers');
    const p = await Product.findById(it.product);
    if (!p) throw fail('One of the products no longer exists');
    lines.push({ product: p._id, name: p.name, qty, rate });
  }
  const total = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const purchase = await Purchase.create({ vendor, items: lines, total, note, date: date || Date.now() });
  for (const l of lines) await Product.updateOne({ _id: l.product }, { $inc: { stock: l.qty }, $set: { purchaseRate: l.rate } });
  if (+paidNow > 0) await Payment.create({ type: 'out', party: 'vendor', vendor, purchase: purchase._id, amount: +paidNow, method, note: 'Paid with purchase' });
  res.status(201).json(purchase);
}));

r.delete('/:id', wrap(async (req, res) => {
  const p = await Purchase.findById(req.params.id);
  if (!p) throw fail('Purchase not found', 404);
  for (const l of p.items)
    await Product.updateOne({ _id: l.product }, [{ $set: { stock: { $max: [0, { $subtract: ['$stock', l.qty] }] } } }]);
  await Payment.deleteMany({ purchase: p._id });
  await p.deleteOne();
  res.json({ ok: true });
}));
module.exports = r;
