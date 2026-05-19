export interface AppTheme {
  isDark: boolean;
  name: string;
  key: string;
  primary: Record<string, string>;
  accent: Record<string, string>;
  success: Record<string, string>;
  warning: Record<string, string>;
  error: Record<string, string>;
  neutral: Record<string, string>;
  bg: {
    primary: string;
    secondary: string;
    card: string;
    elevated: string;
    border: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
}

// ─── DARK THEMES ────────────────────────────────────────────────

// 1. Vanta Black — true black, zero light escape
export const VantaBlackTheme: AppTheme = {
  isDark: true,
  name: 'Vanta Black',
  key: 'vanta-black',
  primary: {
    50: '#e8f4fd',
    100: '#c5e1f9',
    200: '#9ecef4',
    300: '#72baf0',
    400: '#50abed',
    500: '#2e9ce9',
    600: '#2090e3',
    700: '#1480d8',
    800: '#0e71c8',
    900: '#0455aa',
  },
  accent: {
    50: '#e0f9f9',
    100: '#b0f0ef',
    200: '#7de7e6',
    300: '#48dcdb',
    400: '#1ed4d4',
    500: '#00cccc',
    600: '#00baba',
    700: '#00a3a3',
    800: '#008e8e',
    900: '#006868',
  },
  success: {
    50: '#e8f8f0',
    100: '#c6edd9',
    200: '#9fe2bf',
    300: '#71d6a3',
    400: '#4dcb8b',
    500: '#27bf72',
    600: '#1fad63',
    700: '#129751',
    800: '#088240',
    900: '#005f28',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffbf00',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#fdecea',
    100: '#f9cbc8',
    200: '#f6aaa4',
    300: '#f28980',
    400: '#ef705f',
    500: '#eb573e',
    600: '#e24b34',
    700: '#d63c28',
    800: '#ca2e1e',
    900: '#b5150c',
  },
  neutral: {
    0: '#ffffff',
    50: '#f7f8fa',
    100: '#eef0f3',
    200: '#dde1e7',
    300: '#c8ced8',
    400: '#a0aab8',
    500: '#7a8699',
    600: '#5d6879',
    700: '#444f5f',
    800: '#2d3748',
    900: '#1a202c',
    950: '#0d1117',
  },
  bg: {
    primary: '#000000',
    secondary: '#060606',
    card: '#0a0a0a',
    elevated: '#111111',
    border: '#1a1a1a',
  },
  text: {
    primary: '#f0f4ff',
    secondary: '#8899bb',
    muted: '#4a5a77',
    inverse: '#000000',
  },
};

// 2. Midnight Blue — deep navy, oceanic depth
export const MidnightBlueTheme: AppTheme = {
  isDark: true,
  name: 'Midnight Blue',
  key: 'midnight-blue',
  primary: {
    50: '#e8eef8',
    100: '#c5d4f0',
    200: '#9eb6e5',
    300: '#6e96d9',
    400: '#4a7ece',
    500: '#2e66c2',
    600: '#2254b0',
    700: '#18449c',
    800: '#103688',
    900: '#082466',
  },
  accent: {
    50: '#e6f0ff',
    100: '#b3d4ff',
    200: '#80b8ff',
    300: '#4d9cff',
    400: '#2688ff',
    500: '#0074ff',
    600: '#0062dd',
    700: '#0050bb',
    800: '#003e99',
    900: '#002c77',
  },
  success: {
    50: '#e8f8f0',
    100: '#c6edd9',
    200: '#9fe2bf',
    300: '#71d6a3',
    400: '#4dcb8b',
    500: '#27bf72',
    600: '#1fad63',
    700: '#129751',
    800: '#088240',
    900: '#005f28',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffbf00',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#fdecea',
    100: '#f9cbc8',
    200: '#f6aaa4',
    300: '#f28980',
    400: '#ef705f',
    500: '#eb573e',
    600: '#e24b34',
    700: '#d63c28',
    800: '#ca2e1e',
    900: '#b5150c',
  },
  neutral: {
    0: '#ffffff',
    50: '#e8ecf4',
    100: '#d0d8e8',
    200: '#b4c0d6',
    300: '#96a6c2',
    400: '#7a8eae',
    500: '#5e7698',
    600: '#4a6080',
    700: '#384c68',
    800: '#283a52',
    900: '#1a2a3e',
    950: '#0e1a2c',
  },
  bg: {
    primary: '#0a1628',
    secondary: '#0d1c34',
    card: '#112240',
    elevated: '#162d50',
    border: '#1e3a5f',
  },
  text: {
    primary: '#e0e8f8',
    secondary: '#7a9cc6',
    muted: '#3d6088',
    inverse: '#0a1628',
  },
};

// 3. Cyber Teal — neon-lit dark, electric feel
export const CyberTealTheme: AppTheme = {
  isDark: true,
  name: 'Cyber Teal',
  key: 'cyber-teal',
  primary: {
    50: '#e0f9f4',
    100: '#b3f0e3',
    200: '#80e6d0',
    300: '#4ddcbd',
    400: '#26d4ae',
    500: '#00cc9f',
    600: '#00b48c',
    700: '#009c78',
    800: '#008464',
    900: '#006048',
  },
  accent: {
    50: '#e0fff8',
    100: '#aafff0',
    200: '#66ffe6',
    300: '#33ffde',
    400: '#00ffd6',
    500: '#00e6c0',
    600: '#00cca9',
    700: '#00b392',
    800: '#00997b',
    900: '#00664f',
  },
  success: {
    50: '#e8f8f0',
    100: '#c6edd9',
    200: '#9fe2bf',
    300: '#71d6a3',
    400: '#4dcb8b',
    500: '#27bf72',
    600: '#1fad63',
    700: '#129751',
    800: '#088240',
    900: '#005f28',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffbf00',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#fdecea',
    100: '#f9cbc8',
    200: '#f6aaa4',
    300: '#f28980',
    400: '#ef705f',
    500: '#eb573e',
    600: '#e24b34',
    700: '#d63c28',
    800: '#ca2e1e',
    900: '#b5150c',
  },
  neutral: {
    0: '#ffffff',
    50: '#e8f5f2',
    100: '#cce8e2',
    200: '#aad8cf',
    300: '#88c4b8',
    400: '#66b0a2',
    500: '#4a9a8c',
    600: '#3a8072',
    700: '#2c665a',
    800: '#1e4c42',
    900: '#12322a',
    950: '#0a1e18',
  },
  bg: {
    primary: '#060e0c',
    secondary: '#0a1814',
    card: '#0e201c',
    elevated: '#142a24',
    border: '#1c3a32',
  },
  text: {
    primary: '#e0fff4',
    secondary: '#66ccaa',
    muted: '#2e7a60',
    inverse: '#060e0c',
  },
};

// 4. Obsidian — charcoal dark, warm undertones
export const ObsidianTheme: AppTheme = {
  isDark: true,
  name: 'Obsidian',
  key: 'obsidian',
  primary: {
    50: '#f0eef5',
    100: '#d8d2e8',
    200: '#beb4d8',
    300: '#a496c8',
    400: '#9080bc',
    500: '#7c6ab0',
    600: '#6e5ca0',
    700: '#5e4e8e',
    800: '#4e407c',
    900: '#3a2e60',
  },
  accent: {
    50: '#f5eef8',
    100: '#e0ccee',
    200: '#caa8e0',
    300: '#b484d2',
    400: '#a26cc8',
    500: '#9054be',
    600: '#8046ae',
    700: '#703a9e',
    800: '#602e8e',
    900: '#441c6e',
  },
  success: {
    50: '#e8f8f0',
    100: '#c6edd9',
    200: '#9fe2bf',
    300: '#71d6a3',
    400: '#4dcb8b',
    500: '#27bf72',
    600: '#1fad63',
    700: '#129751',
    800: '#088240',
    900: '#005f28',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffbf00',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#fdecea',
    100: '#f9cbc8',
    200: '#f6aaa4',
    300: '#f28980',
    400: '#ef705f',
    500: '#eb573e',
    600: '#e24b34',
    700: '#d63c28',
    800: '#ca2e1e',
    900: '#b5150c',
  },
  neutral: {
    0: '#ffffff',
    50: '#f0eef2',
    100: '#d8d4de',
    200: '#bab4c2',
    300: '#9c94a8',
    400: '#7e7490',
    500: '#625874',
    600: '#4e4460',
    700: '#3c3450',
    800: '#2c263e',
    900: '#1e1a2e',
    950: '#12101e',
  },
  bg: {
    primary: '#0e0c14',
    secondary: '#14121c',
    card: '#1a1824',
    elevated: '#221e2c',
    border: '#2e2a3a',
  },
  text: {
    primary: '#ece8f4',
    secondary: '#9a90b0',
    muted: '#5a5272',
    inverse: '#0e0c14',
  },
};

// ─── LIGHT THEME ────────────────────────────────────────────────

// Settled Light — warm, grounded, comfortable
export const SettledLightTheme: AppTheme = {
  isDark: false,
  name: 'Settled Light',
  key: 'settled-light',
  primary: {
    50: '#eef3fb',
    100: '#d4e2f4',
    200: '#b5cdec',
    300: '#8fb3e1',
    400: '#6a9ad5',
    500: '#4a82c6',
    600: '#3b6db0',
    700: '#305a96',
    800: '#2a4c7e',
    900: '#1e3a60',
  },
  accent: {
    50: '#e6f7f7',
    100: '#b3e8e8',
    200: '#80d9d9',
    300: '#4dcaca',
    400: '#26bfbf',
    500: '#00b3b3',
    600: '#009e9e',
    700: '#008888',
    800: '#006e6e',
    900: '#004d4d',
  },
  success: {
    50: '#edf9f0',
    100: '#c8ecd0',
    200: '#9edfb0',
    300: '#6fd28d',
    400: '#4bc574',
    500: '#2bb85d',
    600: '#23a650',
    700: '#1b9142',
    800: '#137c35',
    900: '#0a5e24',
  },
  warning: {
    50: '#fef9ed',
    100: '#fcefc5',
    200: '#fbe39a',
    300: '#f9d76f',
    400: '#f7cd4e',
    500: '#f0c030',
    600: '#d9a822',
    700: '#c09018',
    800: '#a77910',
    900: '#7d5608',
  },
  error: {
    50: '#fdeeed',
    100: '#f9cfc9',
    200: '#f5aea5',
    300: '#f08c80',
    400: '#ea7162',
    500: '#e2523f',
    600: '#cc3e2d',
    700: '#b32e20',
    800: '#992216',
    900: '#72100c',
  },
  neutral: {
    0: '#ffffff',
    50: '#faf8f5',
    100: '#f2efe9',
    200: '#e4dfd7',
    300: '#d1cac0',
    400: '#b5ac9f',
    500: '#968c7e',
    600: '#746a5e',
    700: '#564e44',
    800: '#3a342c',
    900: '#1f1b16',
    950: '#0f0d0a',
  },
  bg: {
    primary: '#faf8f5',
    secondary: '#f2efe9',
    card: '#ffffff',
    elevated: '#ffffff',
    border: '#e4dfd7',
  },
  text: {
    primary: '#1f1b16',
    secondary: '#746a5e',
    muted: '#b5ac9f',
    inverse: '#faf8f5',
  },
};

// ─── THEME REGISTRY ─────────────────────────────────────────────

export const DARK_THEMES: AppTheme[] = [
  VantaBlackTheme,
  MidnightBlueTheme,
  CyberTealTheme,
  ObsidianTheme,
];

export const LIGHT_THEMES: AppTheme[] = [
  SettledLightTheme,
];

export const ALL_THEMES: AppTheme[] = [...DARK_THEMES, ...LIGHT_THEMES];

export function getThemeByKey(key: string): AppTheme {
  return ALL_THEMES.find((t) => t.key === key) ?? VantaBlackTheme;
}

// Keep backward compat aliases
export const DarkTheme = VantaBlackTheme;
export const LightTheme = SettledLightTheme;

export const CryptoColors: Record<string, { primary: string; gradient: [string, string] }> = {
  RXP: { primary: '#111827', gradient: ['#111827', '#00aae4'] },
  XRP: { primary: '#00aae4', gradient: ['#00aae4', '#0066cc'] },
  BTC: { primary: '#f7931a', gradient: ['#f7931a', '#c96800'] },
  ETH: { primary: '#627eea', gradient: ['#627eea', '#3358cc'] },
  BNB: { primary: '#f3ba2f', gradient: ['#f3ba2f', '#c98e00'] },
  SOL: { primary: '#9945ff', gradient: ['#9945ff', '#6f10e8'] },
  ADA: { primary: '#0033ad', gradient: ['#0d47a1', '#1565c0'] },
  DOGE: { primary: '#c2a633', gradient: ['#c2a633', '#8a7120'] },
  AVAX: { primary: '#e84142', gradient: ['#e84142', '#b71c1c'] },
  MATIC: { primary: '#8247e5', gradient: ['#8247e5', '#5b20cc'] },
  DOT: { primary: '#e6007a', gradient: ['#e6007a', '#ad0059'] },
  LINK: { primary: '#2a5ada', gradient: ['#2a5ada', '#1a3ca8'] },
};
