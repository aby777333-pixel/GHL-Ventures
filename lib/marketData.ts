// ============================================================
// GHL India Ventures - Market Data Module
// ============================================================

export interface MarketTicker {
  symbol: string
  label: string
  value: string
  change: string
  changePercent: string
  isPositive: boolean
}

// Indian Indices
export const INDIAN_INDICES: MarketTicker[] = [
  { symbol: 'NIFTY50', label: 'NIFTY 50', value: '22,847.50', change: '+187.25', changePercent: '+0.82%', isPositive: true },
  { symbol: 'SENSEX', label: 'SENSEX', value: '75,312.85', change: '+553.10', changePercent: '+0.74%', isPositive: true },
  { symbol: 'BANKNIFTY', label: 'BANK NIFTY', value: '48,156.30', change: '-149.28', changePercent: '-0.31%', isPositive: false },
  { symbol: 'NIFTYIT', label: 'NIFTY IT', value: '36,489.20', change: '+452.47', changePercent: '+1.24%', isPositive: true },
]

// Global Indices
export const GLOBAL_INDICES: MarketTicker[] = [
  { symbol: 'SPX', label: 'S&P 500', value: '5,987.15', change: '+26.94', changePercent: '+0.45%', isPositive: true },
  { symbol: 'IXIC', label: 'NASDAQ', value: '18,972.40', change: '+129.01', changePercent: '+0.68%', isPositive: true },
  { symbol: 'FTSE', label: 'FTSE 100', value: '8,234.50', change: '-14.82', changePercent: '-0.18%', isPositive: false },
  { symbol: 'NKY', label: 'Nikkei 225', value: '39,156.80', change: '+360.24', changePercent: '+0.92%', isPositive: true },
]

// Commodities & Forex
export const COMMODITIES: MarketTicker[] = [
  { symbol: 'GOLD', label: 'Gold', value: '\u20B972,450', change: '+405.72', changePercent: '+0.56%', isPositive: true },
  { symbol: 'SILVER', label: 'Silver', value: '\u20B985,230', change: '+698.89', changePercent: '+0.82%', isPositive: true },
  { symbol: 'CRUDEOIL', label: 'Crude Oil', value: '$78.45', change: '-0.88', changePercent: '-1.12%', isPositive: false },
  { symbol: 'USDINR', label: 'USD/INR', value: '83.12', change: '+0.07', changePercent: '+0.08%', isPositive: true },
]

// Economic Headlines
export const ECONOMIC_HEADLINES: string[] = [
  'RBI holds repo rate at 6.5% for sixth consecutive meeting',
  'India Q3 GDP grows at 8.4%, fastest in 6 quarters',
  'FII inflows turn positive after 3 months of outflows',
  'SEBI tightens AIF disclosure norms for Category II funds',
  'India\u2019s manufacturing PMI rises to 56.9 in January',
  'Government targets \u20B910 lakh crore capex in FY25 infrastructure push',
]

// Combined Market Data
export const ALL_MARKET_DATA: MarketTicker[] = [
  ...INDIAN_INDICES,
  ...GLOBAL_INDICES,
  ...COMMODITIES,
]
