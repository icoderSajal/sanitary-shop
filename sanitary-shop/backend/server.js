require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, ''));

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: (o, cb) => (!o || origins.includes(o) ? cb(null, true) : cb(new Error('Origin not allowed by CORS'))) }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));

app.get('/', (req, res) => res.json({ app: 'Sanitary Shop API', status: 'running' }));
app.get('/api/health', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  let status = err.status || 500, message = err.message || 'Server error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.code === 11000) { status = 400; message = 'Duplicate value: that name or email already exists'; }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid value for ' + err.path; }
  if (status === 500) console.error(err);
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
(async () => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in environment variables');
    await connectDB();
    await ensureAdmin();
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  } catch (e) {
    console.error('Startup failed:', e.message);
    process.exit(1);
  }
})();
