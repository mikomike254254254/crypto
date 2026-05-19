const FALLBACK = [
  { symbol: 'BTC', price: 68420, change24h: 1.8 },
  { symbol: 'ETH', price: 2650, change24h: 0.9 },
  { symbol: 'XRP', price: 2.45, change24h: 2.8 },
  { symbol: 'SOL', price: 148.9, change24h: 4.4 },
  { symbol: 'BNB', price: 612, change24h: 0.5 },
  { symbol: 'RXP', price: 1.39, change24h: 0 },
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const symbols = String(req.query.symbols || 'BTC+ETH+XRP+SOL+BNB')
    .split(/[,+\s]+/)
    .filter(Boolean)
    .join('+');

  const apiKey = process.env.FREECRYPTO_API_KEY;
  if (!apiKey) return res.status(200).json({ source: 'fallback', data: FALLBACK });

  try {
    const url = `https://api.freecryptoapi.com/v1/getData?symbol=${encodeURIComponent(symbols)}`;
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
    });
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(200).json({ source: 'fallback', data: FALLBACK, upstreamError: data });
    }

    return res.status(200).json({ source: 'freecryptoapi', data });
  } catch (error) {
    return res.status(200).json({ source: 'fallback', data: FALLBACK, error: error.message });
  }
};
