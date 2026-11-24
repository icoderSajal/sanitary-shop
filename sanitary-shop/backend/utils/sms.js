module.exports = async (phone, message) => {
  if (!process.env.FAST2SMS_KEY) return console.log('[SMS skipped - no FAST2SMS_KEY]', message);
  try {
    const r = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: process.env.FAST2SMS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, numbers: String(phone).replace(/\D/g, '').slice(-10) }),
    });
    console.log('SMS status', r.status);
  } catch (e) { console.log('SMS failed:', e.message); }
};
