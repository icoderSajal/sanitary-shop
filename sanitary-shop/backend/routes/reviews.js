const r = require('express').Router();
const { Review, Order, Product } = require('../models');
const { protect, admin, wrap, fail } = require('../middleware/auth');

const recalc = async (id) => {
  const a = await Review.aggregate([{ $match: { product: id } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await Product.updateOne({ _id: id }, { rating: a[0] ? Math.round(a[0].avg * 10) / 10 : 0, numReviews: a[0] ? a[0].n : 0 });
};

r.get('/product/:id', wrap(async (req, res) => res.json(await Review.find({ product: req.params.id }).sort('-createdAt').limit(50))));

r.post('/', protect, wrap(async (req, res) => {
  const { product, rating, comment } = req.body;
  if (!(+rating >= 1 && +rating <= 5)) throw fail('Choose a rating from 1 to 5 stars');
  const bought = await Order.exists({ user: req.user._id, status: 'delivered', 'items.product': product });
  if (!bought) throw fail('You can review a product after it has been delivered to you');
  const rev = await Review.findOneAndUpdate(
    { product, user: req.user._id },
    { rating: +rating, comment: comment || '', userName: req.user.name },
    { upsert: true, new: true, setDefaultsOnInsert: true });
  await recalc(rev.product);
  res.status(201).json(rev);
}));

r.delete('/:id', protect, admin, wrap(async (req, res) => {
  const rev = await Review.findByIdAndDelete(req.params.id);
  if (rev) await recalc(rev.product);
  res.json({ ok: true });
}));
module.exports = r;
