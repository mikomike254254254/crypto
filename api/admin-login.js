function send(res, status, payload) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const { email, password } = req.body || {};
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@wallex.online';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'wallex-admin';
  const sessionToken = process.env.ADMIN_API_TOKEN;

  if (!sessionToken) return send(res, 503, { error: 'Admin login is not configured on the server' });
  if (email !== expectedEmail || password !== expectedPassword) {
    return send(res, 401, { error: 'Invalid operations login' });
  }

  return send(res, 200, { token: sessionToken });
};
