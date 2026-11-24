const r = require('express').Router();
const { Payment, Order, Vendor } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');
r.use(protect, admin);

r.get('/', wrap(async (req, res) => {
  const f = {};
  if (['in', 'out'].includes(req.query.type)) f.type = req.query.type;
  if (['customer', 'vendor'].includes(req.query.party)) f.party = req.query.party;
  res.json(await Payment.find(f).populate('vendor', 'name').populate('order', 'orderNo').sort('-date').limit(500));
}));

r.post('/', wrap(async (req, res) => {
  const { type, vendor, order, customerName, amount, method, note, date } = req.body;
  if (!['in', 'out'].includes(type)) throw fail('Payment type must be in or out');
  if (!(+amount > 0)) throw fail('Enter a valid amount');
  const data = { type, amount: +amount, method, note, date: date || Date.now() };
  if (type === 'out') {
    if (!(await Vendor.exists({ _id: vendor }))) throw fail('Select a vendor');
    Object.assign(data, { party: 'vendor', vendor });
  } else {
    Object.assign(data, { party: 'customer', customerName });
    if (order) {
      const o = await Order.findById(order);
      if (!o) throw fail('Order not found');
      data.order = o._id; data.customerName = o.address.name;
    }
  }
  const pay = await Payment.create(data);
  if (data.order) {
    const got = await Payment.aggregate([{ $match: { order: data.order, type: 'in' } }, { $group: { _id: null, t: { $sum: '$amount' } } }]);
    const o = await Order.findById(data.order);
    if (got[0] && got[0].t >= o.total) { o.paymentStatus = 'paid'; await o.save(); }
  }
  res.status(201).json(pay);
}));

r.delete('/:id', wrap(async (req, res) => {
  const p = await Payment.findByIdAndDelete(req.params.id);
  if (p && p.order) {
    const got = await Payment.aggregate([{ $match: { order: p.order, type: 'in' } }, { $group: { _id: null, t: { $sum: '$amount' } } }]);
    const o = await Order.findById(p.order);
    if (o && (!got[0] || got[0].t < o.total)) { o.paymentStatus = 'pending'; await o.save(); }
  }
  res.json({ ok: true });
}));
module.exports = r;
