const { createClient } = require('@supabase/supabase-js');

function send(res, status, payload) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');
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

function isAuthorized(req) {
  const expected = process.env.ADMIN_API_TOKEN;
  const token = req.headers['x-admin-token'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  return Boolean(expected && token && token === expected);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (!isAuthorized(req)) return send(res, 401, { error: 'Admin token required' });

  const supabase = getAdminClient();
  if (!supabase) return send(res, 503, { error: 'Admin backend is not configured' });

  try {
    if (req.method === 'GET') {
      const [
        { count: userCount },
        { count: pendingKyc },
        { count: banCount },
        { data: transactions },
        { data: kycSubmissions },
        { data: awardRows },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('banned_wallets').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(16),
        supabase.from('kyc_submissions').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('transactions').select('amount').eq('token', 'RXP').in('type', ['award', 'signup_bonus']),
      ]);

      return send(res, 200, {
        userCount: userCount ?? 0,
        pendingKyc: pendingKyc ?? 0,
        banCount: banCount ?? 0,
        rxpAwarded: (awardRows ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0),
        transactions: transactions ?? [],
        kycSubmissions: kycSubmissions ?? [],
      });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

    const { action, wallet, amount, status, message, phone } = req.body || {};

    if (action === 'award') {
      if (!wallet || !Number(amount)) return send(res, 400, { error: 'Wallet and amount are required' });
      const { error } = await supabase.from('transactions').insert({
        from_wallet: 'admin',
        to_wallet: wallet,
        amount: Number(amount),
        token: 'RXP',
        type: 'award',
        status: 'completed',
      });
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    if (action === 'approveKyc') {
      if (!wallet) return send(res, 400, { error: 'Wallet is required' });
      const nextStatus = status === 'rejected' ? 'rejected' : 'approved';
      const [{ error: userError }, { error: submissionError }] = await Promise.all([
        supabase
          .from('users')
          .update({ kyc_status: nextStatus })
          .eq('wallet', wallet),
        supabase
          .from('kyc_submissions')
          .update({ status: nextStatus, reviewed_at: new Date().toISOString() })
          .eq('wallet', wallet)
          .eq('status', 'pending'),
      ]);
      if (userError || submissionError) throw userError || submissionError;
      return send(res, 200, { ok: true });
    }

    if (action === 'ban') {
      if (!wallet) return send(res, 400, { error: 'Wallet is required' });
      const { error } = await supabase
        .from('banned_wallets')
        .upsert({ wallet_address: wallet }, { onConflict: 'wallet_address' });
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    if (action === 'notify') {
      if (!message) return send(res, 400, { error: 'Message is required' });
      const { error } = await supabase.from('notifications').insert({
        user_id: wallet || null,
        message,
        type: 'admin',
      });
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    if (action === 'mpesaWithdraw') {
      if (!wallet || !phone || !Number(amount)) return send(res, 400, { error: 'Wallet, phone, and amount are required' });
      const { error } = await supabase.from('mpesa_withdraws').insert({
        wallet,
        phone,
        amount_kes: Number(amount),
        status: 'pending',
      });
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'Unknown admin action' });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Admin action failed' });
  }
};
