// Optional: npm run seed  -> adds sample categories and products (only if the shop has none)
require('dotenv').config();
const mongoose = require('mongoose');
const { Category, Product } = require('./models');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (await Product.countDocuments()) { console.log('Products already exist, skipping'); return process.exit(0); }
  const names = ['PVC Pipes', 'CPVC Pipes', 'UPVC Pipes', 'Fittings', 'Ceramics', 'Taps', 'Accessories'];
  const cats = {};
  for (const n of names) cats[n] = await Category.create({ name: n });
  const P = (name, c, brand, buy, sell, stock, w, unit = 'pcs') => ({ name, category: cats[c]._id, brand, purchaseRate: buy, saleRate: sell, mrp: Math.round(sell * 1.15), stock, weightKg: w, unit, description: `${name} - quality assured` });
  await Product.insertMany([
    P('PVC Pipe 1 inch (3m)', 'PVC Pipes', 'Supreme', 180, 230, 60, 1.8),
    P('CPVC Pipe 3/4 inch (3m)', 'CPVC Pipes', 'Astral', 260, 330, 40, 1.2),
    P('UPVC Pipe 2 inch (3m)', 'UPVC Pipes', 'Finolex', 420, 520, 30, 3.2),
    P('Elbow 1 inch', 'Fittings', 'Supreme', 12, 20, 200, 0.05),
    P('Socket 3/4 inch', 'Fittings', 'Astral', 8, 15, 300, 0),
    P('Tee 1 inch', 'Fittings', 'Finolex', 15, 25, 150, 0),
    P('Wash Basin Oval', 'Ceramics', 'Hindware', 900, 1250, 15, 6),
    P('Western Toilet Seat', 'Ceramics', 'Cera', 2600, 3400, 8, 18),
    P('Indian Toilet Seat 22 inch', 'Ceramics', 'Parryware', 650, 900, 20, 9),
    P('Swan Neck Tap', 'Taps', 'Jaquar', 480, 690, 25, 0.7),
    P('Long Body Tap', 'Taps', 'Cera', 220, 340, 40, 0.5),
    P('PVC Connection Pipe 24 inch', 'Accessories', 'Generic', 35, 60, 120, 0),
  ]);
  console.log('Seeded');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
