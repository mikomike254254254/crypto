function send(res, status, payload) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const { rxpAmount, email, wallet } = req.body || {};
  const units = Number(rxpAmount);

  if (!units || units <= 0) return send(res, 400, { error: 'Enter a valid RXP amount' });

  const amountKes = Math.round(units * 180);
  const reference = `WLX-${Date.now()}`;
  const hostedLink = process.env.PAYFLEE_PAYMENT_LINK_URL;

  if (hostedLink) {
    const url = new URL(hostedLink);
    url.searchParams.set('amount', String(amountKes));
    url.searchParams.set('currency', 'KES');
    url.searchParams.set('reference', reference);
    if (email) url.searchParams.set('email', email);
    if (wallet) url.searchParams.set('wallet', wallet);
    return send(res, 200, { checkoutUrl: url.toString(), amountKes, reference });
  }

  const apiUrl = process.env.PAYFLEE_API_URL;
  const secretKey = process.env.PAYFLEE_SECRET_KEY;

  if (apiUrl && secretKey) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount: amountKes,
        currency: 'KES',
        reference,
        description: `${units} RXP on Wallex`,
        customer: { email, wallet },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return send(res, response.status, { error: data.error || 'Payflee checkout failed' });
    return send(res, 200, {
      checkoutUrl: data.checkout_url || data.url || data.payment_url,
      amountKes,
      reference,
      raw: data,
    });
  }

  return send(res, 202, {
    amountKes,
    reference,
    message: 'Payflee checkout is ready for server configuration. Add PAYFLEE_API_URL or PAYFLEE_PAYMENT_LINK_URL in Vercel.',
  });
};
