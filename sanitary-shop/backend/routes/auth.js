const r = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { protect, wrap, fail } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const pub = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role });

r.post('/register', wrap(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) throw fail('Name, email, mobile and password are required');
  if (String(password).length < 6) throw fail('Password must be at least 6 characters');
  if (!/^\d{10}$/.test(String(phone).replace(/\D/g, '').slice(-10))) throw fail('Enter a valid 10 digit mobile number');
  if (await User.findOne({ email: String(email).toLowerCase() })) throw fail('This email is already registered');
  const u = await User.create({ name, email, phone, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));

r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email: String(email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(String(password || ''), u.password))) throw fail('Wrong email or password', 401);
  res.json({ token: sign(u), user: pub(u) });
}));

r.get('/me', protect, (req, res) => res.json(pub(req.user)));
module.exports = r;
