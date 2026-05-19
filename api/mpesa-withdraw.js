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

  const supabase = getAdminClient();
  if (!supabase) return send(res, 503, { error: 'Withdrawal backend is not configured' });

  const { wallet, phone, amountKes } = req.body || {};
  const amount = Number(amountKes);

  if (!wallet || !phone || !amount || amount <= 0) {
    return send(res, 400, { error: 'Wallet, phone, and amount are required' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('wallet,kyc_status')
    .eq('wallet', wallet)
    .maybeSingle();

  if (userError) return send(res, 500, { error: userError.message });
  if (!user) return send(res, 404, { error: 'Wallet profile not found in Supabase' });
  if (!['approved', 'verified'].includes(user.kyc_status)) {
    return send(res, 403, { error: 'Wallex KYC approval is required before M-Pesa withdrawals' });
  }

  const { error } = await supabase.from('mpesa_withdraws').insert({
    wallet,
    phone,
    amount_kes: amount,
    status: 'pending',
  });

  if (error) return send(res, 500, { error: error.message });

  await supabase.from('notifications').insert({
    user_id: wallet,
    message: `M-Pesa withdrawal request for KSh ${amount.toLocaleString('en-KE')} was submitted for review.`,
    type: 'mpesa_withdrawal',
  });

  return send(res, 200, {
    ok: true,
    message: 'M-Pesa withdrawal request submitted for review.',
  });
};
