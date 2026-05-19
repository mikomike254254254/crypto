import { RIPPLE_LOGO_URL, WALLEX_BRAND } from '@/constants/brand';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  icon: string;
  address: string;
}

export const CRYPTO_ASSETS: CryptoAsset[] = [
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'Wallex XRP',
    balance: WALLEX_BRAND.signupBonusXrp,
    price: WALLEX_BRAND.xrpUsdPrice,
    change24h: 0.8,
    icon: RIPPLE_LOGO_URL,
    address: 'rWallexXRPn4F9mV8sK2pQ6tD3zA7bYc',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 0,
    price: 67450.0,
    change24h: 1.87,
    icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 0,
    price: 3480.5,
    change24h: -0.94,
    icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB Chain',
    balance: 0,
    price: 598.3,
    change24h: 0.52,
    icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    balance: 0,
    price: 182.6,
    change24h: 5.11,
    icon: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    address: 'DmRuDQMkk6ViGF8JF9eXWMnC5h8gDpP4T67XnJbK7Ld',
  },
  {
    id: 'ada',
    symbol: 'ADA',
    name: 'Cardano',
    balance: 0,
    price: 0.4581,
    change24h: -1.38,
    icon: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    address: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwqfjkjv7',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    balance: 0,
    price: 0.1632,
    change24h: 2.6,
    icon: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    address: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
  },
  {
    id: 'avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    balance: 0,
    price: 38.42,
    change24h: -2.11,
    icon: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    address: 'X-avax1vkzmut8zyn45sf3kvwn5khpfzxqmtq3q08z2xe',
  },
  {
    id: 'matic',
    symbol: 'MATIC',
    name: 'Polygon',
    balance: 0,
    price: 0.8812,
    change24h: 1.04,
    icon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    id: 'dot',
    symbol: 'DOT',
    name: 'Polkadot',
    balance: 0,
    price: 7.94,
    change24h: -0.72,
    icon: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    address: '14E5nqKAp3oAJcmzgs25fyszahWQmVZiI4PLomCEy9KMqe3',
  },
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink',
    balance: 0,
    price: 14.52,
    change24h: 3.78,
    icon: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
];

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  symbol: string;
  amount: number;
  usdValue: number;
  address: string;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
  txHash: string;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    symbol: 'XRP',
    amount: WALLEX_BRAND.signupBonusXrp,
    usdValue: WALLEX_BRAND.signupBonusUsd,
    address: 'system@wallex',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: '4A4E0B88A88CD19F2E1A4E7B9C2D3E4F5A6B7C8D',
  },
];
