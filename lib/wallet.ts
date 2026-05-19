export function createRxpWalletAddress(email: string, name = 'member') {
  const seedSource = `${email || name || 'member'}:${name || 'wallex'}`.toLowerCase();
  const namePart = normalizeWalletSeed(email.split('@')[0] || name || 'member').slice(0, 16) || 'member';
  return `rxp_${namePart}_${walletChecksum(seedSource)}`;
}

export function isRxpWalletAddress(address: string) {
  return /^rxp_[a-z0-9]{3,18}_[a-z0-9]{7}$/.test(address.trim().toLowerCase());
}

export function shortWallet(address: string, front = 12, back = 6) {
  if (!address) return 'rxp_wallet_pending';
  if (address.length <= front + back + 3) return address;
  return `${address.slice(0, front)}...${address.slice(-back)}`;
}

function normalizeWalletSeed(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18);
}

function walletChecksum(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).padStart(7, '0').slice(0, 7);
}
