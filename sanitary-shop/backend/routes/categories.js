const r = require('express').Router();
const { Category, Product } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');

r.get('/', wrap(async (req, res) => {
  const cats = await Category.find().sort('name').lean();
  const counts = await Product.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', n: { $sum: 1 } } }]);
  const m = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json(cats.map((c) => ({ ...c, productCount: m.get(String(c._id)) || 0 })));
}));
r.post('/', protect, admin, wrap(async (req, res) => res.status(201).json(await Category.create(req.body))));
r.put('/:id', protect, admin, wrap(async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) throw fail('Category not found', 404);
  res.json(c);
}));
r.delete('/:id', protect, admin, wrap(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) throw fail('Move or delete the products in this category first');
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
module.exports = r;
