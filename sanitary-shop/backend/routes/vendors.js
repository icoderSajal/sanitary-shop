const r = require('express').Router();
const { Vendor, Purchase, Payment } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');
r.use(protect, admin);

r.get('/', wrap(async (req, res) => {
  const [vs, bills, paid] = await Promise.all([
    Vendor.find().sort('name').lean(),
    Purchase.aggregate([{ $group: { _id: '$vendor', t: { $sum: '$total' } } }]),
    Payment.aggregate([{ $match: { party: 'vendor', type: 'out' } }, { $group: { _id: '$vendor', t: { $sum: '$amount' } } }]),
  ]);
  const b = new Map(bills.map((x) => [String(x._id), x.t])), p = new Map(paid.map((x) => [String(x._id), x.t]));
  res.json(vs.map((v) => {
    const billed = b.get(String(v._id)) || 0, paidAmt = p.get(String(v._id)) || 0;
    return { ...v, billed, paid: paidAmt, due: billed - paidAmt };
  }));
}));
r.post('/', wrap(async (req, res) => res.status(201).json(await Vendor.create(req.body))));
r.put('/:id', wrap(async (req, res) => {
  const v = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!v) throw fail('Vendor not found', 404);
  res.json(v);
}));
r.delete('/:id', wrap(async (req, res) => {
  if (await Purchase.exists({ vendor: req.params.id })) throw fail('This vendor has purchase records and cannot be deleted');
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
module.exports = r;
