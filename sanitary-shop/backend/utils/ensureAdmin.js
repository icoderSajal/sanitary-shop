const bcrypt = require('bcryptjs');
const { User } = require('../models');
module.exports = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@shop.com').toLowerCase();
  if (await User.findOne({ email })) return;
  await User.create({
    name: process.env.ADMIN_NAME || 'Shop Owner', email,
    phone: process.env.ADMIN_PHONE || '9999999999',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10), role: 'admin',
  });
  console.log('Admin created:', email);
};
