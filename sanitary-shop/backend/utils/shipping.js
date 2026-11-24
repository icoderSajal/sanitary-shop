const { Product } = require('../models');
const { fail } = require('../middleware/auth');

const num = (v, d) => (v !== undefined && v !== null && v !== '' && Number.isFinite(+v) ? +v : d);
const rules = () => ({
  base: num(process.env.SHIP_BASE, 40),
  perKm: num(process.env.SHIP_PER_KM, 2),
  perKg: num(process.env.SHIP_PER_KG, 3),
  max: num(process.env.MAX_DISTANCE_KM, 500),
  free: num(process.env.FREE_SHIP_ABOVE, 0),
});

const haversine = (lat1, lon1, lat2, lon2) => {
  const rad = (x) => (x * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GPS first (x1.3 road factor), otherwise the km typed by the customer
function resolveDistance({ lat, lng, distanceKm }) {
  const R = rules();
  const slat = num(process.env.SHOP_LAT, NaN), slng = num(process.env.SHOP_LNG, NaN);
  const hasGps = num(lat, null) !== null && num(lng, null) !== null && Number.isFinite(slat) && Number.isFinite(slng);
  const d = hasGps ? haversine(+lat, +lng, slat, slng) * 1.3 : num(distanceKm, 0);
  return Math.min(Math.max(0, Math.round(d * 10) / 10), R.max);
}

// Weight 0 products are charged by distance only; weighted products add a weight x distance component.
function calcShipping({ distanceKm, weightKg, itemsTotal }) {
  const R = rules();
  const d = Math.max(0, distanceKm);
  let c = R.base + d * R.perKm;
  if (weightKg > 0) c += weightKg * R.perKg * (1 + d / 100);
  if (R.free > 0 && itemsTotal >= R.free) c = 0;
  return Math.round(c);
}

async function buildLines(items) {
  if (!Array.isArray(items) || !items.length) throw fail('Cart is empty');
  const prods = await Product.find({ _id: { $in: items.map((i) => i.product) }, active: true }).populate('category', 'name');
  const map = new Map(prods.map((p) => [String(p._id), p]));
  const lines = [];
  let itemsTotal = 0, weightKg = 0;
  for (const it of items) {
    const p = map.get(String(it.product));
    const qty = Math.floor(+it.qty);
    if (!p) throw fail('A product in your cart is no longer available');
    if (!(qty > 0)) throw fail(`Invalid quantity for ${p.name}`);
    if (p.stock < qty) throw fail(`Only ${p.stock} left in stock for ${p.name}`);
    lines.push({ product: p._id, name: p.name, image: p.image, category: p.category ? p.category.name : 'Other', qty, price: p.saleRate, cost: p.purchaseRate, weightKg: p.weightKg });
    itemsTotal += p.saleRate * qty;
    weightKg += p.weightKg * qty;
  }
  return { lines, itemsTotal, weightKg: Math.round(weightKg * 100) / 100 };
}

module.exports = { resolveDistance, calcShipping, buildLines, rules };
