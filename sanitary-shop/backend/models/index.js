const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const ref = (n) => ({ type: Schema.Types.ObjectId, ref: n });
const T = { timestamps: true };

const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
}, T));

const Category = model('Category', new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
}, T));

const Product = model('Product', new Schema({
  name: { type: String, required: true, trim: true },
  category: { ...ref('Category'), required: true },
  brand: { type: String, trim: true, default: 'Generic' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  purchaseRate: { type: Number, default: 0, min: 0 },
  saleRate: { type: Number, required: true, min: 0 },
  mrp: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockLimit: { type: Number, default: 10, min: 0 },
  weightKg: { type: Number, default: 0, min: 0 }, // 0 = no weight, shipping uses distance only
  unit: { type: String, default: 'pcs' },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, T));

const Vendor = model('Vendor', new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  gstin: { type: String, default: '' },
}, T));

const Purchase = model('Purchase', new Schema({
  vendor: { ...ref('Vendor'), required: true },
  items: [{ product: ref('Product'), name: String, qty: Number, rate: Number }],
  total: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, T));

const Payment = model('Payment', new Schema({
  type: { type: String, enum: ['in', 'out'], required: true }, // in = received, out = paid
  party: { type: String, enum: ['customer', 'vendor'], required: true },
  vendor: ref('Vendor'),
  order: ref('Order'),
  purchase: ref('Purchase'),
  customerName: { type: String, default: '' },
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'], default: 'cash' },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, T));

const orderSchema = new Schema({
  orderNo: { type: String, unique: true },
  user: { ...ref('User'), required: true },
  items: [{ product: ref('Product'), name: String, image: String, category: String, qty: Number, price: Number, cost: Number, weightKg: Number }],
  address: { name: String, phone: String, line: String, city: String, state: String, pincode: String },
  distanceKm: { type: Number, default: 0 },
  weightKg: { type: Number, default: 0 },
  itemsTotal: Number,
  shipping: Number,
  total: Number,
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  status: { type: String, enum: ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], default: 'placed' },
  history: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
  note: { type: String, default: '' },
}, T);
orderSchema.pre('validate', function (next) {
  if (!this.orderNo) this.orderNo = 'SH' + Date.now().toString().slice(-7) + Math.floor(100 + Math.random() * 900);
  next();
});
const Order = model('Order', orderSchema);

const reviewSchema = new Schema({
  product: { ...ref('Product'), required: true },
  user: { ...ref('User'), required: true },
  userName: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, T);
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
const Review = model('Review', reviewSchema);

module.exports = { User, Category, Product, Vendor, Purchase, Payment, Order, Review };
