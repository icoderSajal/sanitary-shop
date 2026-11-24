const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please log in to continue' });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account not found' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};
exports.admin = (req, res, next) =>
  req.user && req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' });
exports.wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.fail = (message, status = 400) => Object.assign(new Error(message), { status });
