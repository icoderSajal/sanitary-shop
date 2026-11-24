const r = require('express').Router();
const mongoose = require('mongoose');
const { Order, Product, Payment } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');
const { resolveDistance, calcShipping, buildLines, rules } = require('../utils/shipping');
const sms = require('../utils/sms');

const FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const restock = (o) => Promise.all(o.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));

// Public: price preview before login/checkout
r.post('/quote', wrap(async (req, res) => {
  const { lines, itemsTotal, weightKg } = await buildLines(req.body.items);
  const distanceKm = resolveDistance(req.body);
  const shipping = calcShipping({ distanceKm, weightKg, itemsTotal });
  const R = rules();
  res.json({ itemsTotal, weightKg, distanceKm, shipping, total: itemsTotal + shipping, rules: { base: R.base, perKm: R.perKm, perKg: R.perKg }, count: lines.length });
}));

r.post('/', protect, wrap(async (req, res) => {
  const a = req.body.address || {};
  for (const k of ['name', 'phone', 'line', 'city', 'pincode']) if (!String(a[k] || '').trim()) throw fail(`Please enter ${k} in the address`);
  const { lines, itemsTotal, weightKg } = await buildLines(req.body.items);
  const distanceKm = resolveDistance(req.body);
  const shipping = calcShipping({ distanceKm, weightKg, itemsTotal });

  const done = [];
  try {
    for (const l of lines) {
      const ok = await Product.findOneAndUpdate({ _id: l.product, stock: { $gte: l.qty } }, { $inc: { stock: -l.qty } });
      if (!ok) throw fail(`${l.name} just went out of stock`);
      done.push(l);
    }
  } catch (e) {
    await Promise.all(done.map((l) => Product.updateOne({ _id: l.product }, { $inc: { stock: l.qty } })));
    throw e;
  }
  const o = await Order.create({
    user: req.user._id, items: lines, address: a, distanceKm, weightKg, itemsTotal, shipping,
    total: itemsTotal + shipping, note: req.body.note || '', history: [{ status: 'placed', note: 'Order placed (Cash on Delivery)' }],
  });
  sms(a.phone || req.user.phone, `Thank you ${a.name}! Order ${o.orderNo} placed. Pay Rs ${o.total} on delivery.`);
  res.status(201).json(o);
}));

r.get('/mine', protect, wrap(async (req, res) => res.json(await Order.find({ user: req.user._id }).sort('-createdAt'))));

r.get('/', protect, admin, wrap(async (req, res) => {
  const f = req.query.status ? { status: req.query.status } : {};
  res.json(await Order.find(f).populate('user', 'name phone email').sort('-createdAt').limit(300));
}));

r.get('/:id', protect, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw fail('Order not found', 404);
  const o = await Order.findById(req.params.id).populate('user', 'name phone email');
  if (!o || (req.user.role !== 'admin' && String(o.user._id) !== String(req.user._id))) throw fail('Order not found', 404);
  res.json(o);
}));

r.put('/:id/cancel', protect, wrap(async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!o) throw fail('Order not found', 404);
  if (!['placed', 'confirmed'].includes(o.status)) throw fail('This order is already packed and can no longer be cancelled');
  await restock(o);
  o.status = 'cancelled'; o.history.push({ status: 'cancelled', note: 'Cancelled by customer' });
  await o.save();
  res.json(o);
}));

r.put('/:id/status', protect, admin, wrap(async (req, res) => {
  const { status, note } = req.body;
  if (![...FLOW, 'cancelled'].includes(status)) throw fail('Invalid status');
  const o = await Order.findById(req.params.id);
  if (!o) throw fail('Order not found', 404);
  if (['cancelled', 'delivered'].includes(o.status)) throw fail(`Order is already ${o.status}`);
  if (status === 'cancelled') await restock(o);
  o.status = status; o.history.push({ status, note: note || '' });
  if (status === 'delivered' && o.paymentStatus === 'pending') {
    o.paymentStatus = 'paid';
    await Payment.create({ type: 'in', party: 'customer', order: o._id, customerName: o.address.name, amount: o.total, method: 'cash', note: `COD collected for ${o.orderNo}` });
  }
  await o.save();
  sms(o.address.phone, `Order ${o.orderNo} is now ${status.replace(/_/g, ' ')}.`);
  res.json(o);
}));
module.exports = r;
