const { createClient } = require('@supabase/supabase-js');

function send(res, status, payload) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
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
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  return Boolean(expected && token && token === expected);
}

async function sendUserEmail({ to, subject, message }) {
  if (!to) return { ok: false, skipped: true };

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Wallex <support@wallex.online>',
        to,
        subject,
        text: message,
      }),
    });
    return { ok: response.ok };
  }

  if (process.env.EMAIL_WEBHOOK_URL) {
    const response = await fetch(process.env.EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message }),
    });
    return { ok: response.ok };
  }

  return { ok: false, skipped: true };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (!isAuthorized(req)) return send(res, 401, { error: 'Operations login required' });

  const supabase = getAdminClient();
  if (!supabase) return send(res, 503, { error: 'Operations backend is not configured' });

  try {
    if (req.method === 'GET') {
      const [
        { count: userCount },
        { count: pendingKyc },
        { count: banCount },
        { data: transactions },
        { data: kycSubmissions },
        { data: awardRows },
        { data: wallets },
        { data: walletBalances },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('banned_wallets').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(16),
        supabase.from('kyc_submissions').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('transactions').select('amount').eq('token', 'XRP').in('type', ['award', 'signup_bonus']),
        supabase.from('users').select('wallet,email,full_name,kyc_status').order('created_at', { ascending: false }).limit(30),
        supabase.from('wallet_balances').select('wallet,token,amount').limit(500),
      ]);

      const balancesByWallet = (walletBalances ?? []).reduce((acc, row) => {
        acc[row.wallet] = acc[row.wallet] || [];
        acc[row.wallet].push({ token: row.token, amount: Number(row.amount || 0) });
        return acc;
      }, {});

      return send(res, 200, {
        userCount: userCount ?? 0,
        pendingKyc: pendingKyc ?? 0,
        banCount: banCount ?? 0,
        xrpAwarded: (awardRows ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0),
        transactions: transactions ?? [],
        kycSubmissions: kycSubmissions ?? [],
        wallets: (wallets ?? []).map((walletRow) => ({
          ...walletRow,
          balances: balancesByWallet[walletRow.wallet] || [{ token: 'XRP', amount: 0 }],
        })),
      });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

    const { action, wallet, amount, status, message, phone, token } = req.body || {};
    const tokenSymbol = String(token || 'XRP').toUpperCase();

    if (action === 'award') {
      if (!wallet || !Number(amount)) return send(res, 400, { error: 'Wallet and amount are required' });
      const { error } = await supabase.from('transactions').insert({
        from_wallet: 'wallex',
        to_wallet: wallet,
        amount: Number(amount),
        token: tokenSymbol,
        type: 'award',
        status: 'completed',
        note: `Wallex ${tokenSymbol} credit`,
      });
      if (error) throw error;
      await supabase.from('notifications').insert({
        user_id: wallet,
        message: `Your Wallex wallet received ${Number(amount).toLocaleString()} ${tokenSymbol}.`,
        type: 'wallet_credit',
      });
      return send(res, 200, { ok: true });
    }

    if (action === 'setBalance') {
      if (!wallet || !Number.isFinite(Number(amount))) return send(res, 400, { error: 'Wallet and amount are required' });
      const { error } = await supabase.from('wallet_balances').upsert({
        wallet,
        token: tokenSymbol,
        amount: Number(amount),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'wallet,token' });
      if (error) throw error;

      if (tokenSymbol === 'XRP') {
        const { error: balError } = await supabase.from('balances').upsert({
          wallet,
          amount: Number(amount),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet' });
        if (balError) throw balError;
      }

      await supabase.from('notifications').insert({
        user_id: wallet,
        message: `Your ${tokenSymbol} wallet balance was updated.`,
        type: 'balance_update',
      });
      return send(res, 200, { ok: true });
    }

    if (action === 'approveKyc') {
      if (!wallet) return send(res, 400, { error: 'Wallet is required' });
      const nextStatus = status === 'rejected' ? 'rejected' : 'approved';
      const { data: user } = await supabase.from('users').select('email,full_name').eq('wallet', wallet).maybeSingle();
      const [{ error: userError }, { error: submissionError }, { error: notificationError }] = await Promise.all([
        supabase.from('users').update({ kyc_status: nextStatus }).eq('wallet', wallet),
        supabase
          .from('kyc_submissions')
          .update({ status: nextStatus, reviewed_at: new Date().toISOString() })
          .eq('wallet', wallet)
          .eq('status', 'pending'),
        supabase.from('notifications').insert({
          user_id: wallet,
          message: nextStatus === 'approved'
            ? 'Your KYC verification has been approved.'
            : 'Your KYC verification needs an update. Please resubmit your documents.',
          type: 'kyc',
        }),
      ]);
      if (userError || submissionError || notificationError) throw userError || submissionError || notificationError;
      await sendUserEmail({
        to: user?.email,
        subject: nextStatus === 'approved' ? 'Wallex KYC approved' : 'Wallex KYC update needed',
        message: nextStatus === 'approved'
          ? `Hi ${user?.full_name || 'there'}, your Wallex KYC verification has been approved.`
          : `Hi ${user?.full_name || 'there'}, your Wallex KYC verification needs an update. Please sign in and resubmit your documents.`,
      });
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
      let recipients = [];
      if (wallet) {
        const { data } = await supabase.from('users').select('email').eq('wallet', wallet);
        recipients = data ?? [];
      } else {
        const { data } = await supabase.from('users').select('email').limit(250);
        recipients = data ?? [];
      }

      const { error } = await supabase.from('notifications').insert({
        user_id: wallet || null,
        message,
        type: 'wallex',
      });
      if (error) throw error;
      await Promise.all(recipients.map((recipient) => sendUserEmail({
        to: recipient.email,
        subject: 'Wallex wallet update',
        message,
      })));
      return send(res, 200, { ok: true });
    }

    if (action === 'mpesaWithdraw') {
      if (!wallet || !phone || !Number(amount)) return send(res, 400, { error: 'Wallet, phone, and amount are required' });
      const { data: user, error: userError } = await supabase.from('users').select('kyc_status').eq('wallet', wallet).maybeSingle();
      if (userError) throw userError;
      if (!['approved', 'verified'].includes(user?.kyc_status)) {
        return send(res, 403, { error: 'KYC approval required before M-Pesa withdrawal' });
      }
      const { error } = await supabase.from('mpesa_withdraws').insert({
        wallet,
        phone,
        amount_kes: Number(amount),
        status: 'pending',
      });
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    if (action === 'promoteAdmin') {
      const { email } = req.body || {};
      if (!email) return send(res, 400, { error: 'Email is required to promote to admin' });
      
      const { error } = await supabase.from('admins').upsert({
        email: email.trim().toLowerCase(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'Unknown action' });

  } catch (error) {
    return send(res, 500, { error: error.message || 'Action failed' });
  }
};
