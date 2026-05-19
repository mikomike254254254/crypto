export function createRippleWalletAddress(email: string, name = 'member') {
  const seedSource = `${email || name || 'member'}:${name || 'wallex'}:xrp`.toLowerCase();
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = 2166136261;
  let body = '';

  for (let i = 0; body.length < 33; i += 1) {
    const charCode = seedSource.charCodeAt(i % seedSource.length) + i;
    hash ^= charCode;
    hash = Math.imul(hash, 16777619);
    body += alphabet[Math.abs(hash >>> 0) % alphabet.length];
  }

  return `r${body}`;
}

export function isRippleWalletAddress(address: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address.trim());
}

export function shortWallet(address: string, front = 12, back = 6) {
  if (!address) return 'xrp_wallet_pending';
  if (address.length <= front + back + 3) return address;
  return `${address.slice(0, front)}...${address.slice(-back)}`;
}
