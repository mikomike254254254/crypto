import { WALLEX_BRAND } from '@/constants/brand';

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
    id: 'rxp',
    symbol: 'RXP',
    name: 'Wallex Reward Points',
    balance: 1500,
    price: WALLEX_BRAND.rxpUsdPrice,
    change24h: 0.8,
    icon: WALLEX_BRAND.logoUrl,
    address: 'wallex-demo-wallet',
  },
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'XRP Ledger',
    balance: 4285.42,
    price: 0.6138,
    change24h: 3.24,
    icon: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 0.0842,
    price: 67450.0,
    change24h: 1.87,
    icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 1.334,
    price: 3480.5,
    change24h: -0.94,
    icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB Chain',
    balance: 5.72,
    price: 598.3,
    change24h: 0.52,
    icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    balance: 12.1,
    price: 182.6,
    change24h: 5.11,
    icon: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    address: 'DmRuDQMkk6ViGF8JF9eXWMnC5h8gDpP4T67XnJbK7Ld',
  },
  {
    id: 'ada',
    symbol: 'ADA',
    name: 'Cardano',
    balance: 1250.0,
    price: 0.4581,
    change24h: -1.38,
    icon: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    address: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwqfjkjv7',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    balance: 8400.0,
    price: 0.1632,
    change24h: 2.6,
    icon: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    address: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
  },
  {
    id: 'avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    balance: 18.5,
    price: 38.42,
    change24h: -2.11,
    icon: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    address: 'X-avax1vkzmut8zyn45sf3kvwn5khpfzxqmtq3q08z2xe',
  },
  {
    id: 'matic',
    symbol: 'MATIC',
    name: 'Polygon',
    balance: 620.0,
    price: 0.8812,
    change24h: 1.04,
    icon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    id: 'dot',
    symbol: 'DOT',
    name: 'Polkadot',
    balance: 45.0,
    price: 7.94,
    change24h: -0.72,
    icon: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    address: '14E5nqKAp3oAJcmzgs25fyszahWQmVZiI4PLomCEy9KMqe3',
  },
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink',
    balance: 32.8,
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
    symbol: 'RXP',
    amount: 500,
    usdValue: 695,
    address: 'admin@wallex',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: '4A4E0B88A88CD19F2E1A4E7B9C2D3E4F5A6B7C8D',
  },
  {
    id: '2',
    type: 'send',
    symbol: 'BTC',
    amount: 0.005,
    usdValue: 337.25,
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: '8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E',
  },
  {
    id: '3',
    type: 'receive',
    symbol: 'ETH',
    amount: 0.25,
    usdValue: 870.12,
    address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: '1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
  },
  {
    id: '4',
    type: 'swap',
    symbol: 'RXP',
    amount: 200,
    usdValue: 278,
    address: 'Internal Swap',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: '5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A',
  },
  {
    id: '5',
    type: 'send',
    symbol: 'RXP',
    amount: 150,
    usdValue: 208.5,
    address: 'wallex-nairobi-desk',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'pending',
    txHash: '9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C',
  },
];
