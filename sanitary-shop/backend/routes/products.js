const r = require('express').Router();
const mongoose = require('mongoose');
const { Product } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

r.get('/', wrap(async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, sort = 'new' } = req.query;
  const page = Math.max(1, +req.query.page || 1), limit = Math.min(48, Math.max(1, +req.query.limit || 12));
  const f = { active: true };
  if (q) f.name = { $regex: esc(q), $options: 'i' };
  if (category) f.category = { $in: String(category).split(',').filter((id) => mongoose.isValidObjectId(id)) };
  if (brand) f.brand = { $in: String(brand).split(',') };
  const price = {};
  if (minPrice !== undefined && minPrice !== '' && !isNaN(+minPrice)) price.$gte = +minPrice;
  if (maxPrice !== undefined && maxPrice !== '' && !isNaN(+maxPrice)) price.$lte = +maxPrice;
  if (Object.keys(price).length) f.saleRate = price;
  const sorts = { new: { createdAt: -1 }, low: { saleRate: 1 }, high: { saleRate: -1 }, rating: { rating: -1 } };
  const [items, total] = await Promise.all([
    Product.find(f).select('-purchaseRate').populate('category', 'name').sort(sorts[sort] || sorts.new).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(f),
  ]);
  res.json({ items, total, pages: Math.ceil(total / limit) || 1, page });
}));

r.get('/meta/filters', wrap(async (req, res) => {
  const [brands, range] = await Promise.all([
    Product.distinct('brand', { active: true }),
    Product.aggregate([{ $match: { active: true } }, { $group: { _id: null, min: { $min: '$saleRate' }, max: { $max: '$saleRate' } } }]),
  ]);
  res.json({ brands: brands.filter(Boolean).sort(), min: range[0]?.min || 0, max: range[0]?.max || 1000 });
}));

r.get('/admin/all', protect, admin, wrap(async (req, res) => {
  res.json(await Product.find().populate('category', 'name').sort('-createdAt'));
}));

r.get('/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw fail('Product not found', 404);
  const p = await Product.findOne({ _id: req.params.id, active: true }).select('-purchaseRate').populate('category', 'name');
  if (!p) throw fail('Product not found', 404);
  res.json(p);
}));

r.post('/', protect, admin, wrap(async (req, res) => res.status(201).json(await Product.create(req.body))));
r.put('/:id', protect, admin, wrap(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!p) throw fail('Product not found', 404);
  res.json(p);
}));
r.delete('/:id', protect, admin, wrap(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
module.exports = r;
