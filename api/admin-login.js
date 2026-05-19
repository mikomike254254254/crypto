const { createClient } = require('@supabase/supabase-js');

function send(res, status, payload) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(payload);
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const { email, password } = req.body || {};
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@wallex.online';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'wallex-admin';
  const sessionToken = process.env.ADMIN_API_TOKEN;

  if (!sessionToken) return send(res, 503, { error: 'Admin login is not configured on the server' });

  // 1. Check default static admin
  if (email === expectedEmail && password === expectedPassword) {
    return send(res, 200, { token: sessionToken });
  }

  // 2. Check database-backed promoted admins
  try {
    const supabase = getAdminClient();
    if (supabase && email && password) {
      // Authenticate password via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!authError && authData.user) {
        // Query the database to check if this user has been promoted
        const { data: adminRecord, error: adminError } = await supabase
          .from('admins')
          .select('email')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (!adminError && adminRecord) {
          return send(res, 200, { token: sessionToken });
        }
      }
    }
  } catch (err) {
    console.error('Promoted admin login error:', err);
  }

  return send(res, 401, { error: 'Invalid credentials or unauthorized administrator email' });
};

