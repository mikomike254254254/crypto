export const XRP_USD_PRICE = 1.39;
export const SIGNUP_BONUS_USD = 15;
export const SIGNUP_BONUS_XRP = Number((SIGNUP_BONUS_USD / XRP_USD_PRICE).toFixed(2));
export const USD_TO_KES = 129.19;

export const WALLEX_BRAND = {
  name: 'Wallex',
  siteName: 'wallex.online',
  domain: 'https://wallex.online',
  websiteUrl: 'https://wallex.online',
  supportEmail: 'wallexcrypto@proton.me',
  logoUrl: 'https://i.postimg.cc/C5xPhJz5/wallex-logo.jpg',
  heroImageUrl: 'https://i.postimg.cc/PJvDQ87K/dc2a020fb68e8bd16b808612feaf0954.jpg',
  portfolioBackgroundUrl: 'https://i.postimg.cc/g0Ng0J7b/b41640c9e405eb79941055db517017a0.jpg',
  primarySymbol: 'XRP',
  xrpRateKes: 180,
  xrpUsdPrice: XRP_USD_PRICE,
  usdToKes: USD_TO_KES,
  signupBonusUsd: SIGNUP_BONUS_USD,
  signupBonusXrp: SIGNUP_BONUS_XRP,
};

export const RIPPLE_LOGO_URL = 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png';

export const CARTOON_AVATARS = [
  {
    id: 'female',
    label: 'Female',
    uri: 'https://api.dicebear.com/9.x/adventurer/png?seed=Nova&backgroundColor=b6e3f4',
  },
  {
    id: 'male',
    label: 'Male',
    uri: 'https://api.dicebear.com/9.x/adventurer/png?seed=Atlas&backgroundColor=d1d4f9',
  },
  {
    id: 'guardian',
    label: 'Guardian',
    uri: 'https://api.dicebear.com/9.x/bottts-neutral/png?seed=WallexGuardian&backgroundColor=c0aede',
  },
  {
    id: 'builder',
    label: 'Builder',
    uri: 'https://api.dicebear.com/9.x/personas/png?seed=WallexBuilder&backgroundColor=ffd5dc',
  },
];

export const POPULAR_MARKETS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    icon: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    icon: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    icon: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  },
];
