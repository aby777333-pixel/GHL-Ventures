// ============================================================
// GHL India Ventures - Investment Calculator Utilities
// ============================================================

export interface CalculationResult {
  invested: number
  returns: number
  total: number
  cagr: number
}

/**
 * SIP Calculator: Monthly investment compounded
 */
export function calculateSIP(
  monthlyAmount: number,
  years: number,
  annualRate: number
): CalculationResult {
  const months = years * 12
  const monthlyRate = annualRate / 100 / 12
  const invested = monthlyAmount * months

  let total: number
  if (monthlyRate === 0) {
    total = invested
  } else {
    total = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  }

  const returns = total - invested
  const cagr = invested > 0 ? (Math.pow(total / invested, 1 / years) - 1) * 100 : 0

  return { invested, returns, total, cagr }
}

/**
 * Co-Invest Framework Calculator: Lump sum with fixed returns
 */
export function calculateDebenture(
  principal: number,
  years: number,
  annualRate: number
): CalculationResult {
  const total = principal * Math.pow(1 + annualRate / 100, years)
  const returns = total - principal

  return {
    invested: principal,
    returns,
    total,
    cagr: annualRate,
  }
}

/**
 * AIF Calculator: Lump sum with compounding (target IRR)
 */
export function calculateAIF(
  principal: number,
  years: number,
  irr: number
): CalculationResult {
  const total = principal * Math.pow(1 + irr / 100, years)
  const returns = total - principal

  return {
    invested: principal,
    returns,
    total,
    cagr: irr,
  }
}

/**
 * Format Indian Rupee amounts with Lakh/Crore notation
 */
export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Comparison data: asset class benchmarks
 */
export const COMPARISON_BENCHMARKS = [
  { name: 'Fixed Deposit', rate: 7, color: '#6B7280' },
  { name: 'Gold', rate: 10, color: '#F59E0B' },
  { name: 'Real Estate', rate: 12, color: '#22C55E' },
  { name: 'NIFTY 50', rate: 14, color: '#3B82F6' },
  { name: 'GHL Co-Invest', rate: 16, color: '#8B5CF6' },
  { name: 'GHL AIF', rate: 20, color: '#D0021B' },
]
