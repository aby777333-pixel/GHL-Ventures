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

// Mock data removed (2026-04-20) — previously had hardcoded indices,
// commodities and economic headlines. Arrays emptied; MarketDataMarquee
// short-circuits to null when ALL_MARKET_DATA is empty.
export const INDIAN_INDICES: MarketTicker[] = []
export const GLOBAL_INDICES: MarketTicker[] = []
export const COMMODITIES: MarketTicker[] = []
export const ECONOMIC_HEADLINES: string[] = []

// Combined Market Data
export const ALL_MARKET_DATA: MarketTicker[] = [
  ...INDIAN_INDICES,
  ...GLOBAL_INDICES,
  ...COMMODITIES,
]
