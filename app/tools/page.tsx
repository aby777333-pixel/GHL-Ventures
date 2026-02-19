'use client'

import { useState, useMemo } from 'react'
import AnimatedSection from '@/components/AnimatedSection'
import {
  Calculator, TrendingUp, Building2, BarChart3, Landmark,
  PiggyBank, Shield, DollarSign, Brain, Search,
  IndianRupee, ArrowRight, ChevronDown, ChevronUp, Percent,
  Wallet, Home, LineChart, Scale, Coins, Globe, Star,
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

/* ================================================================
   TYPES
   ================================================================ */
type ToolCategory = {
  id: string
  icon: React.ElementType
  label: string
  color: string
  tools: ToolDef[]
}

type ToolDef = {
  name: string
  inputs: InputDef[]
  compute: (vals: Record<string, number>) => { label: string; value: string }[]
}

type InputDef = {
  key: string
  label: string
  placeholder: string
  defaultVal: number
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
}

/* ================================================================
   UTILITY FUNCTIONS
   ================================================================ */
function fmt(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '0'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
function fmtCur(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '\u20B90'
  return '\u20B9' + fmt(n)
}
function fmtPct(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '0%'
  return n.toFixed(2) + '%'
}

/* ================================================================
   CALCULATOR DEFINITIONS - 9 CATEGORIES
   ================================================================ */

// ── 1. Investment Calculators ──
const investmentTools: ToolDef[] = [
  {
    name: 'SIP Calculator',
    inputs: [
      { key: 'monthly', label: 'Monthly SIP Amount', placeholder: '10000', defaultVal: 10000, prefix: '\u20B9' },
      { key: 'rate', label: 'Expected Annual Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'years', label: 'Investment Period', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12; const n = v.years * 12
      const fv = v.monthly * (((1 + r) ** n - 1) / r) * (1 + r)
      const invested = v.monthly * n
      return [
        { label: 'Total Invested', value: fmtCur(invested) },
        { label: 'Est. Returns', value: fmtCur(fv - invested) },
        { label: 'Total Value', value: fmtCur(fv) },
        { label: 'Wealth Gain', value: fmtPct(((fv / invested) - 1) * 100) },
      ]
    },
  },
  {
    name: 'Lump Sum Investment Calculator',
    inputs: [
      { key: 'principal', label: 'Investment Amount', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'rate', label: 'Expected Annual Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'years', label: 'Time Period', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const fv = v.principal * (1 + v.rate / 100) ** v.years
      return [
        { label: 'Invested', value: fmtCur(v.principal) },
        { label: 'Est. Returns', value: fmtCur(fv - v.principal) },
        { label: 'Total Value', value: fmtCur(fv) },
      ]
    },
  },
  {
    name: 'Compound Interest Calculator',
    inputs: [
      { key: 'principal', label: 'Principal', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'rate', label: 'Annual Interest Rate', placeholder: '8', defaultVal: 8, suffix: '%' },
      { key: 'years', label: 'Time Period', placeholder: '5', defaultVal: 5, suffix: 'years' },
      { key: 'compound', label: 'Compounds Per Year', placeholder: '4', defaultVal: 4 },
    ],
    compute: (v) => {
      const a = v.principal * (1 + v.rate / 100 / v.compound) ** (v.compound * v.years)
      return [
        { label: 'Principal', value: fmtCur(v.principal) },
        { label: 'Interest Earned', value: fmtCur(a - v.principal) },
        { label: 'Total Amount', value: fmtCur(a) },
      ]
    },
  },
  {
    name: 'Future Value Calculator',
    inputs: [
      { key: 'pv', label: 'Present Value', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
      { key: 'rate', label: 'Annual Return', placeholder: '10', defaultVal: 10, suffix: '%' },
      { key: 'years', label: 'Years', placeholder: '15', defaultVal: 15, suffix: 'years' },
    ],
    compute: (v) => {
      const fv = v.pv * (1 + v.rate / 100) ** v.years
      return [
        { label: 'Future Value', value: fmtCur(fv) },
        { label: 'Growth', value: fmtCur(fv - v.pv) },
        { label: 'Growth Multiple', value: (fv / v.pv).toFixed(2) + 'x' },
      ]
    },
  },
  {
    name: 'Present Value Calculator',
    inputs: [
      { key: 'fv', label: 'Future Value Needed', placeholder: '10000000', defaultVal: 10000000, prefix: '\u20B9' },
      { key: 'rate', label: 'Discount Rate', placeholder: '10', defaultVal: 10, suffix: '%' },
      { key: 'years', label: 'Years From Now', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const pv = v.fv / (1 + v.rate / 100) ** v.years
      return [
        { label: 'Present Value', value: fmtCur(pv) },
        { label: 'You Need to Invest Today', value: fmtCur(pv) },
      ]
    },
  },
  {
    name: 'Investment Growth Calculator',
    inputs: [
      { key: 'initial', label: 'Initial Investment', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'monthly', label: 'Monthly Addition', placeholder: '5000', defaultVal: 5000, prefix: '\u20B9' },
      { key: 'rate', label: 'Annual Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'years', label: 'Years', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12; const n = v.years * 12
      const lumpFv = v.initial * (1 + r) ** n
      const sipFv = v.monthly * (((1 + r) ** n - 1) / r) * (1 + r)
      const total = lumpFv + sipFv
      const invested = v.initial + v.monthly * n
      return [
        { label: 'Total Invested', value: fmtCur(invested) },
        { label: 'Total Value', value: fmtCur(total) },
        { label: 'Wealth Created', value: fmtCur(total - invested) },
      ]
    },
  },
  {
    name: 'Portfolio Return Calculator',
    inputs: [
      { key: 'start', label: 'Starting Value', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
      { key: 'end', label: 'Current Value', placeholder: '750000', defaultVal: 750000, prefix: '\u20B9' },
      { key: 'years', label: 'Holding Period', placeholder: '3', defaultVal: 3, suffix: 'years' },
    ],
    compute: (v) => {
      const totalReturn = ((v.end - v.start) / v.start) * 100
      const cagr = ((v.end / v.start) ** (1 / v.years) - 1) * 100
      return [
        { label: 'Total Return', value: fmtPct(totalReturn) },
        { label: 'CAGR', value: fmtPct(cagr) },
        { label: 'Profit', value: fmtCur(v.end - v.start) },
      ]
    },
  },
  {
    name: 'CAGR Calculator',
    inputs: [
      { key: 'begin', label: 'Beginning Value', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'final', label: 'Ending Value', placeholder: '250000', defaultVal: 250000, prefix: '\u20B9' },
      { key: 'years', label: 'Number of Years', placeholder: '5', defaultVal: 5, suffix: 'years' },
    ],
    compute: (v) => {
      const cagr = ((v.final / v.begin) ** (1 / v.years) - 1) * 100
      return [
        { label: 'CAGR', value: fmtPct(cagr) },
        { label: 'Absolute Return', value: fmtPct(((v.final - v.begin) / v.begin) * 100) },
      ]
    },
  },
  {
    name: 'XIRR Calculator',
    inputs: [
      { key: 'invested', label: 'Total Invested', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
      { key: 'current', label: 'Current Value', placeholder: '720000', defaultVal: 720000, prefix: '\u20B9' },
      { key: 'years', label: 'Avg Holding Period', placeholder: '3', defaultVal: 3, suffix: 'years' },
    ],
    compute: (v) => {
      const xirr = ((v.current / v.invested) ** (1 / v.years) - 1) * 100
      return [
        { label: 'Approx. XIRR', value: fmtPct(xirr) },
        { label: 'Total Gain', value: fmtCur(v.current - v.invested) },
      ]
    },
  },
  {
    name: 'IRR Calculator',
    inputs: [
      { key: 'initial', label: 'Initial Investment', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'annual', label: 'Annual Cash Flow', placeholder: '200000', defaultVal: 200000, prefix: '\u20B9' },
      { key: 'years', label: 'Years', placeholder: '7', defaultVal: 7, suffix: 'years' },
      { key: 'terminal', label: 'Terminal Value', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      // Newton-Raphson approximation for IRR
      let irr = 0.1
      for (let iter = 0; iter < 100; iter++) {
        let npv = -v.initial; let dnpv = 0
        for (let t = 1; t <= v.years; t++) {
          const cf = t === v.years ? v.annual + v.terminal : v.annual
          npv += cf / (1 + irr) ** t
          dnpv -= t * cf / (1 + irr) ** (t + 1)
        }
        if (Math.abs(npv) < 0.01) break
        irr = irr - npv / dnpv
      }
      return [
        { label: 'IRR', value: fmtPct(irr * 100) },
        { label: 'Total Cash Flows', value: fmtCur(v.annual * v.years + v.terminal) },
      ]
    },
  },
  {
    name: 'Dividend Yield Calculator',
    inputs: [
      { key: 'price', label: 'Share Price', placeholder: '2500', defaultVal: 2500, prefix: '\u20B9' },
      { key: 'dividend', label: 'Annual Dividend/Share', placeholder: '60', defaultVal: 60, prefix: '\u20B9' },
      { key: 'shares', label: 'Number of Shares', placeholder: '100', defaultVal: 100 },
    ],
    compute: (v) => {
      const yld = (v.dividend / v.price) * 100
      const totalDiv = v.dividend * v.shares
      return [
        { label: 'Dividend Yield', value: fmtPct(yld) },
        { label: 'Annual Dividend Income', value: fmtCur(totalDiv) },
        { label: 'Monthly Dividend Income', value: fmtCur(totalDiv / 12) },
      ]
    },
  },
  {
    name: 'Inflation-Adjusted Return Calculator',
    inputs: [
      { key: 'nominal', label: 'Nominal Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'inflation', label: 'Inflation Rate', placeholder: '6', defaultVal: 6, suffix: '%' },
      { key: 'invested', label: 'Amount Invested', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'years', label: 'Years', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const realRate = ((1 + v.nominal / 100) / (1 + v.inflation / 100) - 1) * 100
      const nominalFv = v.invested * (1 + v.nominal / 100) ** v.years
      const realFv = v.invested * (1 + realRate / 100) ** v.years
      return [
        { label: 'Real Return Rate', value: fmtPct(realRate) },
        { label: 'Nominal Future Value', value: fmtCur(nominalFv) },
        { label: 'Real (Inflation-Adjusted) Value', value: fmtCur(realFv) },
        { label: 'Purchasing Power Lost', value: fmtCur(nominalFv - realFv) },
      ]
    },
  },
  {
    name: 'Real Return Calculator',
    inputs: [
      { key: 'nominal', label: 'Nominal Return', placeholder: '15', defaultVal: 15, suffix: '%' },
      { key: 'inflation', label: 'Inflation Rate', placeholder: '6', defaultVal: 6, suffix: '%' },
    ],
    compute: (v) => {
      const realReturn = ((1 + v.nominal / 100) / (1 + v.inflation / 100) - 1) * 100
      return [
        { label: 'Real Return', value: fmtPct(realReturn) },
        { label: 'Inflation Drag', value: fmtPct(v.nominal - realReturn) },
      ]
    },
  },
  {
    name: 'Risk vs. Return Analyzer',
    inputs: [
      { key: 'returnA', label: 'Investment A Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'riskA', label: 'Investment A Risk (Std Dev)', placeholder: '18', defaultVal: 18, suffix: '%' },
      { key: 'returnB', label: 'Investment B Return', placeholder: '8', defaultVal: 8, suffix: '%' },
      { key: 'riskB', label: 'Investment B Risk (Std Dev)', placeholder: '8', defaultVal: 8, suffix: '%' },
    ],
    compute: (v) => {
      const sharpeA = (v.returnA - 6) / v.riskA // assuming 6% risk-free
      const sharpeB = (v.returnB - 6) / v.riskB
      return [
        { label: 'Sharpe Ratio A', value: sharpeA.toFixed(3) },
        { label: 'Sharpe Ratio B', value: sharpeB.toFixed(3) },
        { label: 'Better Risk-Adjusted', value: sharpeA > sharpeB ? 'Investment A' : 'Investment B' },
      ]
    },
  },
]

// ── 2. Income & Cash Flow Tools ──
const incomeTools: ToolDef[] = [
  {
    name: 'Monthly Income Planner',
    inputs: [
      { key: 'corpus', label: 'Investment Corpus', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'rate', label: 'Annual Yield', placeholder: '8', defaultVal: 8, suffix: '%' },
    ],
    compute: (v) => {
      const monthly = (v.corpus * v.rate / 100) / 12
      return [
        { label: 'Monthly Income', value: fmtCur(monthly) },
        { label: 'Annual Income', value: fmtCur(monthly * 12) },
        { label: 'Daily Income', value: fmtCur(monthly / 30) },
      ]
    },
  },
  {
    name: 'Passive Income Calculator',
    inputs: [
      { key: 'target', label: 'Target Monthly Income', placeholder: '50000', defaultVal: 50000, prefix: '\u20B9' },
      { key: 'rate', label: 'Expected Yield', placeholder: '8', defaultVal: 8, suffix: '%' },
    ],
    compute: (v) => {
      const corpus = (v.target * 12) / (v.rate / 100)
      return [
        { label: 'Corpus Required', value: fmtCur(corpus) },
        { label: 'Annual Income Needed', value: fmtCur(v.target * 12) },
      ]
    },
  },
  {
    name: 'Rental Yield Calculator',
    inputs: [
      { key: 'property', label: 'Property Value', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'rent', label: 'Monthly Rent', placeholder: '20000', defaultVal: 20000, prefix: '\u20B9' },
      { key: 'expenses', label: 'Annual Expenses', placeholder: '30000', defaultVal: 30000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const gross = (v.rent * 12 / v.property) * 100
      const net = ((v.rent * 12 - v.expenses) / v.property) * 100
      return [
        { label: 'Gross Rental Yield', value: fmtPct(gross) },
        { label: 'Net Rental Yield', value: fmtPct(net) },
        { label: 'Annual Rental Income', value: fmtCur(v.rent * 12) },
      ]
    },
  },
  {
    name: 'Cash Flow Projection Tool',
    inputs: [
      { key: 'income', label: 'Monthly Income', placeholder: '150000', defaultVal: 150000, prefix: '\u20B9' },
      { key: 'expenses', label: 'Monthly Expenses', placeholder: '80000', defaultVal: 80000, prefix: '\u20B9' },
      { key: 'growth', label: 'Annual Income Growth', placeholder: '10', defaultVal: 10, suffix: '%' },
      { key: 'years', label: 'Project For', placeholder: '5', defaultVal: 5, suffix: 'years' },
    ],
    compute: (v) => {
      let totalSavings = 0
      const finalIncome = v.income * (1 + v.growth / 100) ** v.years
      for (let y = 0; y < v.years; y++) {
        const yearIncome = v.income * (1 + v.growth / 100) ** y
        totalSavings += (yearIncome - v.expenses) * 12
      }
      return [
        { label: 'Current Monthly Savings', value: fmtCur(v.income - v.expenses) },
        { label: 'Income After ' + v.years + ' Years', value: fmtCur(finalIncome) },
        { label: 'Total Savings Over Period', value: fmtCur(totalSavings) },
      ]
    },
  },
  {
    name: 'Retirement Income Calculator',
    inputs: [
      { key: 'corpus', label: 'Retirement Corpus', placeholder: '30000000', defaultVal: 30000000, prefix: '\u20B9' },
      { key: 'withdraw', label: 'Annual Withdrawal Rate', placeholder: '4', defaultVal: 4, suffix: '%' },
      { key: 'inflation', label: 'Inflation', placeholder: '6', defaultVal: 6, suffix: '%' },
    ],
    compute: (v) => {
      const annualIncome = v.corpus * v.withdraw / 100
      const after10 = annualIncome / (1 + v.inflation / 100) ** 10
      return [
        { label: 'Year 1 Annual Income', value: fmtCur(annualIncome) },
        { label: 'Year 1 Monthly Income', value: fmtCur(annualIncome / 12) },
        { label: 'Real Value After 10 Yrs', value: fmtCur(after10 / 12) + '/mo' },
      ]
    },
  },
  {
    name: 'Withdrawal Strategy Calculator',
    inputs: [
      { key: 'corpus', label: 'Starting Corpus', placeholder: '20000000', defaultVal: 20000000, prefix: '\u20B9' },
      { key: 'monthly', label: 'Monthly Withdrawal', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'growth', label: 'Portfolio Growth Rate', placeholder: '8', defaultVal: 8, suffix: '%' },
    ],
    compute: (v) => {
      let balance = v.corpus; let years = 0
      const r = v.growth / 100 / 12
      while (balance > 0 && years < 100) {
        balance = balance * (1 + r) - v.monthly
        years += 1 / 12
      }
      return [
        { label: 'Money Lasts', value: Math.floor(years) + ' years ' + Math.round((years % 1) * 12) + ' months' },
        { label: 'Total Withdrawn', value: fmtCur(v.monthly * Math.floor(years * 12)) },
      ]
    },
  },
  {
    name: 'Safe Withdrawal Rate Calculator',
    inputs: [
      { key: 'corpus', label: 'Retirement Corpus', placeholder: '50000000', defaultVal: 50000000, prefix: '\u20B9' },
      { key: 'years', label: 'Retirement Duration', placeholder: '30', defaultVal: 30, suffix: 'years' },
      { key: 'growth', label: 'Expected Return', placeholder: '8', defaultVal: 8, suffix: '%' },
    ],
    compute: (v) => {
      const r = v.growth / 100 / 12; const n = v.years * 12
      const pmt = v.corpus * r / (1 - (1 + r) ** -n)
      return [
        { label: 'Safe Monthly Withdrawal', value: fmtCur(pmt) },
        { label: 'Safe Annual Withdrawal', value: fmtCur(pmt * 12) },
        { label: 'Withdrawal Rate', value: fmtPct((pmt * 12 / v.corpus) * 100) },
      ]
    },
  },
  {
    name: 'FIRE Calculator',
    inputs: [
      { key: 'expenses', label: 'Annual Expenses', placeholder: '1200000', defaultVal: 1200000, prefix: '\u20B9' },
      { key: 'savings', label: 'Current Savings', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'monthlySavings', label: 'Monthly Savings', placeholder: '80000', defaultVal: 80000, prefix: '\u20B9' },
      { key: 'rate', label: 'Investment Return', placeholder: '10', defaultVal: 10, suffix: '%' },
    ],
    compute: (v) => {
      const fireNumber = v.expenses * 25 // 4% rule
      let balance = v.savings; let months = 0
      const r = v.rate / 100 / 12
      while (balance < fireNumber && months < 600) {
        balance = balance * (1 + r) + v.monthlySavings
        months++
      }
      return [
        { label: 'FIRE Number', value: fmtCur(fireNumber) },
        { label: 'Years to FIRE', value: (months / 12).toFixed(1) + ' years' },
        { label: 'Gap', value: fmtCur(Math.max(0, fireNumber - v.savings)) },
      ]
    },
  },
]

// ── 3. Real Estate Investment Tools ──
const realEstateTools: ToolDef[] = [
  {
    name: 'Property ROI Calculator',
    inputs: [
      { key: 'purchase', label: 'Purchase Price', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'current', label: 'Current Value', placeholder: '7500000', defaultVal: 7500000, prefix: '\u20B9' },
      { key: 'rental', label: 'Total Rental Earned', placeholder: '600000', defaultVal: 600000, prefix: '\u20B9' },
      { key: 'expenses', label: 'Total Expenses', placeholder: '200000', defaultVal: 200000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const totalReturn = v.current - v.purchase + v.rental - v.expenses
      const roi = (totalReturn / v.purchase) * 100
      return [
        { label: 'Total ROI', value: fmtPct(roi) },
        { label: 'Net Profit', value: fmtCur(totalReturn) },
        { label: 'Capital Gain', value: fmtCur(v.current - v.purchase) },
      ]
    },
  },
  {
    name: 'Cap Rate Calculator',
    inputs: [
      { key: 'noi', label: 'Net Operating Income/Year', placeholder: '360000', defaultVal: 360000, prefix: '\u20B9' },
      { key: 'value', label: 'Property Value', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const cap = (v.noi / v.value) * 100
      return [
        { label: 'Cap Rate', value: fmtPct(cap) },
        { label: 'Monthly NOI', value: fmtCur(v.noi / 12) },
      ]
    },
  },
  {
    name: 'EMI Calculator',
    inputs: [
      { key: 'loan', label: 'Loan Amount', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'rate', label: 'Interest Rate', placeholder: '8.5', defaultVal: 8.5, suffix: '%' },
      { key: 'tenure', label: 'Loan Tenure', placeholder: '20', defaultVal: 20, suffix: 'years' },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12; const n = v.tenure * 12
      const emi = v.loan * r * (1 + r) ** n / ((1 + r) ** n - 1)
      const totalPaid = emi * n
      return [
        { label: 'Monthly EMI', value: fmtCur(emi) },
        { label: 'Total Interest', value: fmtCur(totalPaid - v.loan) },
        { label: 'Total Payment', value: fmtCur(totalPaid) },
      ]
    },
  },
  {
    name: 'Loan Affordability Calculator',
    inputs: [
      { key: 'income', label: 'Monthly Income', placeholder: '200000', defaultVal: 200000, prefix: '\u20B9' },
      { key: 'emiPercent', label: 'Max EMI (% of Income)', placeholder: '40', defaultVal: 40, suffix: '%' },
      { key: 'rate', label: 'Interest Rate', placeholder: '8.5', defaultVal: 8.5, suffix: '%' },
      { key: 'tenure', label: 'Tenure', placeholder: '20', defaultVal: 20, suffix: 'years' },
    ],
    compute: (v) => {
      const maxEmi = v.income * v.emiPercent / 100
      const r = v.rate / 100 / 12; const n = v.tenure * 12
      const loanAmount = maxEmi * ((1 + r) ** n - 1) / (r * (1 + r) ** n)
      return [
        { label: 'Max EMI Affordable', value: fmtCur(maxEmi) },
        { label: 'Max Loan Amount', value: fmtCur(loanAmount) },
        { label: 'Property Budget (80% LTV)', value: fmtCur(loanAmount / 0.8) },
      ]
    },
  },
  {
    name: 'Mortgage Amortization Calculator',
    inputs: [
      { key: 'loan', label: 'Loan Amount', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'rate', label: 'Interest Rate', placeholder: '8.5', defaultVal: 8.5, suffix: '%' },
      { key: 'tenure', label: 'Tenure', placeholder: '20', defaultVal: 20, suffix: 'years' },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12; const n = v.tenure * 12
      const emi = v.loan * r * (1 + r) ** n / ((1 + r) ** n - 1)
      const y1Interest = v.loan * v.rate / 100
      const y1Principal = emi * 12 - y1Interest
      return [
        { label: 'Monthly EMI', value: fmtCur(emi) },
        { label: 'Year 1 Interest', value: fmtCur(y1Interest) },
        { label: 'Year 1 Principal', value: fmtCur(y1Principal) },
        { label: 'Total Interest Paid', value: fmtCur(emi * n - v.loan) },
      ]
    },
  },
  {
    name: 'Real Estate IRR Calculator',
    inputs: [
      { key: 'purchase', label: 'Purchase Price', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'annualRent', label: 'Annual Rent Income', placeholder: '300000', defaultVal: 300000, prefix: '\u20B9' },
      { key: 'salePrice', label: 'Expected Sale Price', placeholder: '8000000', defaultVal: 8000000, prefix: '\u20B9' },
      { key: 'years', label: 'Holding Period', placeholder: '5', defaultVal: 5, suffix: 'years' },
    ],
    compute: (v) => {
      let irr = 0.1
      for (let iter = 0; iter < 100; iter++) {
        let npv = -v.purchase; let dnpv = 0
        for (let t = 1; t <= v.years; t++) {
          const cf = t === v.years ? v.annualRent + v.salePrice : v.annualRent
          npv += cf / (1 + irr) ** t
          dnpv -= t * cf / (1 + irr) ** (t + 1)
        }
        if (Math.abs(npv) < 0.01) break
        irr = irr - npv / dnpv
      }
      return [
        { label: 'Property IRR', value: fmtPct(irr * 100) },
        { label: 'Total Rental Income', value: fmtCur(v.annualRent * v.years) },
        { label: 'Capital Appreciation', value: fmtCur(v.salePrice - v.purchase) },
      ]
    },
  },
  {
    name: 'Property Appreciation Calculator',
    inputs: [
      { key: 'value', label: 'Current Property Value', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'appreciation', label: 'Annual Appreciation', placeholder: '8', defaultVal: 8, suffix: '%' },
      { key: 'years', label: 'Years', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const fv = v.value * (1 + v.appreciation / 100) ** v.years
      return [
        { label: 'Future Value', value: fmtCur(fv) },
        { label: 'Appreciation', value: fmtCur(fv - v.value) },
        { label: 'Growth Multiple', value: (fv / v.value).toFixed(2) + 'x' },
      ]
    },
  },
  {
    name: 'Buy vs. Rent Calculator',
    inputs: [
      { key: 'propValue', label: 'Property Price', placeholder: '8000000', defaultVal: 8000000, prefix: '\u20B9' },
      { key: 'rent', label: 'Monthly Rent', placeholder: '25000', defaultVal: 25000, prefix: '\u20B9' },
      { key: 'appreciation', label: 'Property Appreciation', placeholder: '7', defaultVal: 7, suffix: '%' },
      { key: 'loanRate', label: 'Home Loan Rate', placeholder: '8.5', defaultVal: 8.5, suffix: '%' },
    ],
    compute: (v) => {
      const priceToRent = v.propValue / (v.rent * 12)
      const annualRent = v.rent * 12
      const annualAppreciation = v.propValue * v.appreciation / 100
      const annualEmi = v.propValue * 0.8 * v.loanRate / 100 // approximate first year interest on 80% LTV
      return [
        { label: 'Price-to-Rent Ratio', value: priceToRent.toFixed(1) + 'x' },
        { label: 'Annual Rent Cost', value: fmtCur(annualRent) },
        { label: 'Annual EMI Interest', value: fmtCur(annualEmi) },
        { label: 'Annual Appreciation', value: fmtCur(annualAppreciation) },
        { label: 'Verdict', value: priceToRent < 15 ? 'Buy is Better' : priceToRent < 20 ? 'Neutral' : 'Rent is Better' },
      ]
    },
  },
]

// ── 4. Trading & Market Tools ──
const tradingTools: ToolDef[] = [
  {
    name: 'Position Size Calculator',
    inputs: [
      { key: 'capital', label: 'Trading Capital', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
      { key: 'riskPct', label: 'Risk Per Trade', placeholder: '2', defaultVal: 2, suffix: '%' },
      { key: 'entry', label: 'Entry Price', placeholder: '1500', defaultVal: 1500, prefix: '\u20B9' },
      { key: 'stop', label: 'Stop Loss Price', placeholder: '1450', defaultVal: 1450, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const riskAmount = v.capital * v.riskPct / 100
      const riskPerShare = Math.abs(v.entry - v.stop)
      const qty = Math.floor(riskAmount / riskPerShare)
      return [
        { label: 'Max Risk Amount', value: fmtCur(riskAmount) },
        { label: 'Position Size', value: qty + ' shares' },
        { label: 'Position Value', value: fmtCur(qty * v.entry) },
        { label: 'Risk Per Share', value: fmtCur(riskPerShare) },
      ]
    },
  },
  {
    name: 'Risk Per Trade Calculator',
    inputs: [
      { key: 'capital', label: 'Account Size', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'riskPct', label: 'Risk %', placeholder: '1', defaultVal: 1, suffix: '%' },
    ],
    compute: (v) => {
      const risk = v.capital * v.riskPct / 100
      return [
        { label: 'Max Risk Per Trade', value: fmtCur(risk) },
        { label: 'Max 3 Open Trades Risk', value: fmtCur(risk * 3) },
      ]
    },
  },
  {
    name: 'Stop-Loss Calculator',
    inputs: [
      { key: 'entry', label: 'Entry Price', placeholder: '2000', defaultVal: 2000, prefix: '\u20B9' },
      { key: 'riskPct', label: 'Max Loss %', placeholder: '3', defaultVal: 3, suffix: '%' },
      { key: 'qty', label: 'Quantity', placeholder: '50', defaultVal: 50 },
    ],
    compute: (v) => {
      const sl = v.entry * (1 - v.riskPct / 100)
      const loss = (v.entry - sl) * v.qty
      return [
        { label: 'Stop-Loss Price', value: fmtCur(sl) },
        { label: 'Max Loss Amount', value: fmtCur(loss) },
      ]
    },
  },
  {
    name: 'Break-Even Calculator',
    inputs: [
      { key: 'buy', label: 'Buy Price', placeholder: '1500', defaultVal: 1500, prefix: '\u20B9' },
      { key: 'qty', label: 'Quantity', placeholder: '100', defaultVal: 100 },
      { key: 'brokerage', label: 'Total Charges', placeholder: '500', defaultVal: 500, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const breakeven = v.buy + v.brokerage / v.qty
      return [
        { label: 'Break-Even Price', value: fmtCur(breakeven) },
        { label: 'Cost Per Share (incl charges)', value: fmtCur(breakeven) },
        { label: 'Need Price Rise', value: fmtPct(((breakeven / v.buy) - 1) * 100) },
      ]
    },
  },
  {
    name: 'Profit/Loss Calculator',
    inputs: [
      { key: 'buy', label: 'Buy Price', placeholder: '1500', defaultVal: 1500, prefix: '\u20B9' },
      { key: 'sell', label: 'Sell Price', placeholder: '1750', defaultVal: 1750, prefix: '\u20B9' },
      { key: 'qty', label: 'Quantity', placeholder: '100', defaultVal: 100 },
      { key: 'charges', label: 'Total Charges', placeholder: '800', defaultVal: 800, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const gross = (v.sell - v.buy) * v.qty
      const net = gross - v.charges
      return [
        { label: 'Gross P/L', value: fmtCur(gross) },
        { label: 'Net P/L', value: fmtCur(net) },
        { label: 'Return %', value: fmtPct((net / (v.buy * v.qty)) * 100) },
      ]
    },
  },
  {
    name: 'Margin Calculator',
    inputs: [
      { key: 'price', label: 'Share Price', placeholder: '2000', defaultVal: 2000, prefix: '\u20B9' },
      { key: 'qty', label: 'Quantity', placeholder: '500', defaultVal: 500 },
      { key: 'margin', label: 'Margin Required', placeholder: '20', defaultVal: 20, suffix: '%' },
    ],
    compute: (v) => {
      const totalValue = v.price * v.qty
      const marginRequired = totalValue * v.margin / 100
      const leverage = 100 / v.margin
      return [
        { label: 'Total Position Value', value: fmtCur(totalValue) },
        { label: 'Margin Required', value: fmtCur(marginRequired) },
        { label: 'Leverage', value: leverage.toFixed(1) + 'x' },
      ]
    },
  },
  {
    name: 'Leverage Calculator',
    inputs: [
      { key: 'capital', label: 'Your Capital', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'leverage', label: 'Leverage', placeholder: '5', defaultVal: 5, suffix: 'x' },
      { key: 'gain', label: 'Price Move', placeholder: '2', defaultVal: 2, suffix: '%' },
    ],
    compute: (v) => {
      const exposure = v.capital * v.leverage
      const pl = exposure * v.gain / 100
      return [
        { label: 'Total Exposure', value: fmtCur(exposure) },
        { label: 'P/L on Move', value: fmtCur(pl) },
        { label: 'Effective Return', value: fmtPct(v.gain * v.leverage) },
      ]
    },
  },
  {
    name: 'Futures Calculator',
    inputs: [
      { key: 'entryPrice', label: 'Entry Price', placeholder: '22000', defaultVal: 22000, prefix: '\u20B9' },
      { key: 'exitPrice', label: 'Exit Price', placeholder: '22350', defaultVal: 22350, prefix: '\u20B9' },
      { key: 'lotSize', label: 'Lot Size', placeholder: '25', defaultVal: 25 },
      { key: 'lots', label: 'Number of Lots', placeholder: '1', defaultVal: 1 },
    ],
    compute: (v) => {
      const pl = (v.exitPrice - v.entryPrice) * v.lotSize * v.lots
      return [
        { label: 'P/L', value: fmtCur(pl) },
        { label: 'Points Moved', value: fmt(v.exitPrice - v.entryPrice) },
        { label: 'Total Qty', value: fmt(v.lotSize * v.lots) },
      ]
    },
  },
  {
    name: 'Options Payoff Calculator',
    inputs: [
      { key: 'premium', label: 'Premium Paid', placeholder: '150', defaultVal: 150, prefix: '\u20B9' },
      { key: 'strike', label: 'Strike Price', placeholder: '22000', defaultVal: 22000, prefix: '\u20B9' },
      { key: 'spot', label: 'Spot at Expiry', placeholder: '22400', defaultVal: 22400, prefix: '\u20B9' },
      { key: 'lotSize', label: 'Lot Size', placeholder: '25', defaultVal: 25 },
    ],
    compute: (v) => {
      const intrinsic = Math.max(0, v.spot - v.strike)
      const plPerUnit = intrinsic - v.premium
      const totalPl = plPerUnit * v.lotSize
      return [
        { label: 'Intrinsic Value', value: fmtCur(intrinsic) },
        { label: 'P/L Per Unit', value: fmtCur(plPerUnit) },
        { label: 'Total P/L', value: fmtCur(totalPl) },
        { label: 'Max Loss', value: fmtCur(v.premium * v.lotSize) },
      ]
    },
  },
  {
    name: 'Volatility Calculator',
    inputs: [
      { key: 'high', label: '52-Week High', placeholder: '2500', defaultVal: 2500, prefix: '\u20B9' },
      { key: 'low', label: '52-Week Low', placeholder: '1800', defaultVal: 1800, prefix: '\u20B9' },
      { key: 'current', label: 'Current Price', placeholder: '2200', defaultVal: 2200, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const range = ((v.high - v.low) / v.low) * 100
      const fromHigh = ((v.high - v.current) / v.high) * 100
      const fromLow = ((v.current - v.low) / v.low) * 100
      return [
        { label: '52-Week Range', value: fmtPct(range) },
        { label: 'Below 52W High', value: fmtPct(fromHigh) },
        { label: 'Above 52W Low', value: fmtPct(fromLow) },
      ]
    },
  },
]

// ── 5. Wealth Planning Tools ──
const wealthTools: ToolDef[] = [
  {
    name: 'Net Worth Calculator',
    inputs: [
      { key: 'assets', label: 'Total Assets', placeholder: '15000000', defaultVal: 15000000, prefix: '\u20B9' },
      { key: 'liabilities', label: 'Total Liabilities', placeholder: '3000000', defaultVal: 3000000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const netWorth = v.assets - v.liabilities
      const ratio = v.liabilities / v.assets * 100
      return [
        { label: 'Net Worth', value: fmtCur(netWorth) },
        { label: 'Debt-to-Asset Ratio', value: fmtPct(ratio) },
      ]
    },
  },
  {
    name: 'Goal Planning Calculator',
    inputs: [
      { key: 'goal', label: 'Goal Amount', placeholder: '10000000', defaultVal: 10000000, prefix: '\u20B9' },
      { key: 'current', label: 'Current Savings', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'years', label: 'Years to Goal', placeholder: '10', defaultVal: 10, suffix: 'years' },
      { key: 'rate', label: 'Expected Return', placeholder: '12', defaultVal: 12, suffix: '%' },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12; const n = v.years * 12
      const fvCurrent = v.current * (1 + r) ** n
      const gap = Math.max(0, v.goal - fvCurrent)
      const sip = gap > 0 ? gap / (((1 + r) ** n - 1) / r * (1 + r)) : 0
      return [
        { label: 'Current Savings Will Grow To', value: fmtCur(fvCurrent) },
        { label: 'Gap to Fill', value: fmtCur(gap) },
        { label: 'Monthly SIP Needed', value: fmtCur(sip) },
      ]
    },
  },
  {
    name: 'Retirement Corpus Calculator',
    inputs: [
      { key: 'monthlyExpense', label: 'Current Monthly Expense', placeholder: '80000', defaultVal: 80000, prefix: '\u20B9' },
      { key: 'yearsToRetire', label: 'Years to Retirement', placeholder: '20', defaultVal: 20, suffix: 'years' },
      { key: 'retireYears', label: 'Retirement Duration', placeholder: '25', defaultVal: 25, suffix: 'years' },
      { key: 'inflation', label: 'Inflation', placeholder: '6', defaultVal: 6, suffix: '%' },
    ],
    compute: (v) => {
      const futureExpense = v.monthlyExpense * (1 + v.inflation / 100) ** v.yearsToRetire
      const annualExpense = futureExpense * 12
      const corpus = annualExpense * v.retireYears // simplified
      return [
        { label: 'Future Monthly Expense', value: fmtCur(futureExpense) },
        { label: 'Retirement Corpus Needed', value: fmtCur(corpus) },
        { label: 'Annual Expense at Retirement', value: fmtCur(annualExpense) },
      ]
    },
  },
  {
    name: 'Education Fund Calculator',
    inputs: [
      { key: 'currentCost', label: 'Current Education Cost', placeholder: '2000000', defaultVal: 2000000, prefix: '\u20B9' },
      { key: 'yearsAway', label: 'Years Until Needed', placeholder: '15', defaultVal: 15, suffix: 'years' },
      { key: 'inflation', label: 'Education Inflation', placeholder: '10', defaultVal: 10, suffix: '%' },
      { key: 'rate', label: 'Investment Return', placeholder: '12', defaultVal: 12, suffix: '%' },
    ],
    compute: (v) => {
      const futureCost = v.currentCost * (1 + v.inflation / 100) ** v.yearsAway
      const r = v.rate / 100 / 12; const n = v.yearsAway * 12
      const sip = futureCost / (((1 + r) ** n - 1) / r * (1 + r))
      return [
        { label: 'Future Education Cost', value: fmtCur(futureCost) },
        { label: 'Monthly SIP Required', value: fmtCur(sip) },
      ]
    },
  },
  {
    name: 'Child Future Fund Calculator',
    inputs: [
      { key: 'childAge', label: 'Child Current Age', placeholder: '3', defaultVal: 3, suffix: 'years' },
      { key: 'targetAge', label: 'Target Age', placeholder: '21', defaultVal: 21, suffix: 'years' },
      { key: 'targetAmount', label: 'Target Amount', placeholder: '20000000', defaultVal: 20000000, prefix: '\u20B9' },
      { key: 'rate', label: 'Expected Return', placeholder: '12', defaultVal: 12, suffix: '%' },
    ],
    compute: (v) => {
      const years = v.targetAge - v.childAge
      const r = v.rate / 100 / 12; const n = years * 12
      const sip = v.targetAmount / (((1 + r) ** n - 1) / r * (1 + r))
      const lumpSum = v.targetAmount / (1 + v.rate / 100) ** years
      return [
        { label: 'Years to Invest', value: years + ' years' },
        { label: 'Monthly SIP Required', value: fmtCur(sip) },
        { label: 'Or Lump Sum Today', value: fmtCur(lumpSum) },
      ]
    },
  },
  {
    name: 'Insurance Coverage Calculator',
    inputs: [
      { key: 'income', label: 'Annual Income', placeholder: '1500000', defaultVal: 1500000, prefix: '\u20B9' },
      { key: 'liabilities', label: 'Outstanding Liabilities', placeholder: '3000000', defaultVal: 3000000, prefix: '\u20B9' },
      { key: 'expenses', label: 'Annual Household Expenses', placeholder: '800000', defaultVal: 800000, prefix: '\u20B9' },
      { key: 'years', label: 'Years of Protection', placeholder: '20', defaultVal: 20, suffix: 'years' },
    ],
    compute: (v) => {
      const humanLifeValue = v.income * v.years
      const needsBased = v.expenses * v.years + v.liabilities
      return [
        { label: 'Human Life Value Method', value: fmtCur(humanLifeValue) },
        { label: 'Needs-Based Method', value: fmtCur(needsBased) },
        { label: 'Recommended Coverage', value: fmtCur(Math.max(humanLifeValue, needsBased)) },
      ]
    },
  },
  {
    name: 'Emergency Fund Calculator',
    inputs: [
      { key: 'monthlyExpense', label: 'Monthly Essential Expenses', placeholder: '60000', defaultVal: 60000, prefix: '\u20B9' },
      { key: 'months', label: 'Months of Coverage', placeholder: '6', defaultVal: 6, suffix: 'months' },
      { key: 'existing', label: 'Existing Emergency Fund', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const needed = v.monthlyExpense * v.months
      const gap = Math.max(0, needed - v.existing)
      return [
        { label: 'Emergency Fund Needed', value: fmtCur(needed) },
        { label: 'You Have', value: fmtCur(v.existing) },
        { label: 'Gap', value: fmtCur(gap) },
      ]
    },
  },
]

// ── 6. Tax & Compliance Tools (India) ──
const taxTools: ToolDef[] = [
  {
    name: 'Income Tax Calculator (India)',
    inputs: [
      { key: 'income', label: 'Gross Annual Income', placeholder: '1500000', defaultVal: 1500000, prefix: '\u20B9' },
      { key: 'deductions', label: '80C + Other Deductions', placeholder: '200000', defaultVal: 200000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const taxable = Math.max(0, v.income - v.deductions - 75000) // std deduction
      let tax = 0
      // New regime 2025-26 slabs
      if (taxable > 2400000) tax += (taxable - 2400000) * 0.30
      if (taxable > 2100000) tax += Math.min(taxable - 2100000, 300000) * 0.25
      if (taxable > 1800000) tax += Math.min(taxable - 1800000, 300000) * 0.20
      if (taxable > 1500000) tax += Math.min(taxable - 1500000, 300000) * 0.20
      if (taxable > 1200000) tax += Math.min(taxable - 1200000, 300000) * 0.15
      if (taxable > 800000) tax += Math.min(taxable - 800000, 400000) * 0.10
      if (taxable > 400000) tax += Math.min(taxable - 400000, 400000) * 0.05
      // Rebate u/s 87A if taxable <= 12L
      if (taxable <= 1200000) tax = 0
      const cess = tax * 0.04
      return [
        { label: 'Taxable Income', value: fmtCur(taxable) },
        { label: 'Tax', value: fmtCur(tax) },
        { label: 'Cess (4%)', value: fmtCur(cess) },
        { label: 'Total Tax', value: fmtCur(tax + cess) },
        { label: 'Effective Rate', value: fmtPct(((tax + cess) / v.income) * 100) },
      ]
    },
  },
  {
    name: 'Capital Gains Tax Calculator',
    inputs: [
      { key: 'buyPrice', label: 'Purchase Price', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'sellPrice', label: 'Selling Price', placeholder: '250000', defaultVal: 250000, prefix: '\u20B9' },
      { key: 'holding', label: 'Holding Period', placeholder: '24', defaultVal: 24, suffix: 'months' },
    ],
    compute: (v) => {
      const gain = v.sellPrice - v.buyPrice
      const isLTCG = v.holding > 12
      const taxRate = isLTCG ? 12.5 : 20 // LTCG 12.5% post-July 2024
      const exemption = isLTCG ? 125000 : 0
      const taxableGain = Math.max(0, gain - exemption)
      const tax = taxableGain * taxRate / 100
      return [
        { label: 'Capital Gain', value: fmtCur(gain) },
        { label: 'Type', value: isLTCG ? 'Long-Term (LTCG)' : 'Short-Term (STCG)' },
        { label: 'Tax Rate', value: fmtPct(taxRate) },
        { label: 'LTCG Exemption', value: fmtCur(exemption) },
        { label: 'Tax Payable', value: fmtCur(tax) },
      ]
    },
  },
  {
    name: 'LTCG/STCG Calculator',
    inputs: [
      { key: 'gain', label: 'Capital Gain', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
      { key: 'isLTCG', label: 'Holding > 1 Year? (1=Yes, 0=No)', placeholder: '1', defaultVal: 1 },
    ],
    compute: (v) => {
      const isLTCG = v.isLTCG === 1
      const exemption = isLTCG ? 125000 : 0
      const taxable = Math.max(0, v.gain - exemption)
      const rate = isLTCG ? 12.5 : 20
      const tax = taxable * rate / 100
      return [
        { label: 'Type', value: isLTCG ? 'LTCG' : 'STCG' },
        { label: 'Taxable Gain', value: fmtCur(taxable) },
        { label: 'Tax', value: fmtCur(tax) },
        { label: 'Post-Tax Gain', value: fmtCur(v.gain - tax) },
      ]
    },
  },
  {
    name: 'GST Calculator',
    inputs: [
      { key: 'amount', label: 'Base Amount', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'gstRate', label: 'GST Rate', placeholder: '18', defaultVal: 18, suffix: '%' },
    ],
    compute: (v) => {
      const gst = v.amount * v.gstRate / 100
      const cgst = gst / 2; const sgst = gst / 2
      return [
        { label: 'CGST', value: fmtCur(cgst) },
        { label: 'SGST', value: fmtCur(sgst) },
        { label: 'Total GST', value: fmtCur(gst) },
        { label: 'Amount with GST', value: fmtCur(v.amount + gst) },
      ]
    },
  },
  {
    name: 'HRA Calculator',
    inputs: [
      { key: 'basic', label: 'Basic Salary (Annual)', placeholder: '600000', defaultVal: 600000, prefix: '\u20B9' },
      { key: 'hra', label: 'HRA Received (Annual)', placeholder: '240000', defaultVal: 240000, prefix: '\u20B9' },
      { key: 'rent', label: 'Rent Paid (Annual)', placeholder: '180000', defaultVal: 180000, prefix: '\u20B9' },
      { key: 'isMetro', label: 'Metro City? (1=Yes, 0=No)', placeholder: '1', defaultVal: 1 },
    ],
    compute: (v) => {
      const hraPercent = v.isMetro === 1 ? 50 : 40
      const a = v.hra
      const b = v.basic * hraPercent / 100
      const c = Math.max(0, v.rent - v.basic * 10 / 100)
      const exempt = Math.min(a, b, c)
      return [
        { label: 'HRA Received', value: fmtCur(a) },
        { label: hraPercent + '% of Basic', value: fmtCur(b) },
        { label: 'Rent - 10% Basic', value: fmtCur(c) },
        { label: 'HRA Exemption', value: fmtCur(exempt) },
        { label: 'Taxable HRA', value: fmtCur(v.hra - exempt) },
      ]
    },
  },
  {
    name: 'TDS Calculator',
    inputs: [
      { key: 'amount', label: 'Payment Amount', placeholder: '500000', defaultVal: 500000, prefix: '\u20B9' },
      { key: 'tdsRate', label: 'TDS Rate', placeholder: '10', defaultVal: 10, suffix: '%' },
    ],
    compute: (v) => {
      const tds = v.amount * v.tdsRate / 100
      return [
        { label: 'TDS Deducted', value: fmtCur(tds) },
        { label: 'Net Amount Received', value: fmtCur(v.amount - tds) },
      ]
    },
  },
  {
    name: 'NPS Calculator',
    inputs: [
      { key: 'monthly', label: 'Monthly Contribution', placeholder: '10000', defaultVal: 10000, prefix: '\u20B9' },
      { key: 'age', label: 'Current Age', placeholder: '30', defaultVal: 30, suffix: 'years' },
      { key: 'retireAge', label: 'Retirement Age', placeholder: '60', defaultVal: 60, suffix: 'years' },
      { key: 'rate', label: 'Expected Return', placeholder: '10', defaultVal: 10, suffix: '%' },
    ],
    compute: (v) => {
      const years = v.retireAge - v.age
      const r = v.rate / 100 / 12; const n = years * 12
      const corpus = v.monthly * (((1 + r) ** n - 1) / r) * (1 + r)
      const lumpSum = corpus * 0.6
      const annuity = corpus * 0.4
      return [
        { label: 'Total Corpus', value: fmtCur(corpus) },
        { label: 'Lump Sum (60%)', value: fmtCur(lumpSum) },
        { label: 'Annuity Portion (40%)', value: fmtCur(annuity) },
        { label: 'Total Invested', value: fmtCur(v.monthly * n) },
      ]
    },
  },
  {
    name: '80C Savings Planner',
    inputs: [
      { key: 'epf', label: 'EPF Contribution', placeholder: '50000', defaultVal: 50000, prefix: '\u20B9' },
      { key: 'ppf', label: 'PPF', placeholder: '50000', defaultVal: 50000, prefix: '\u20B9' },
      { key: 'elss', label: 'ELSS Mutual Funds', placeholder: '50000', defaultVal: 50000, prefix: '\u20B9' },
      { key: 'lic', label: 'LIC/Insurance Premium', placeholder: '25000', defaultVal: 25000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const total = v.epf + v.ppf + v.elss + v.lic
      const maxDeduction = 150000
      const claimed = Math.min(total, maxDeduction)
      const taxSaved = claimed * 0.312 // 30% slab + 4% cess
      return [
        { label: 'Total Invested', value: fmtCur(total) },
        { label: 'Deduction Claimed', value: fmtCur(claimed) },
        { label: 'Remaining Limit', value: fmtCur(Math.max(0, maxDeduction - total)) },
        { label: 'Tax Saved (30% slab)', value: fmtCur(taxSaved) },
      ]
    },
  },
]

// ── 7. Risk & Strategy Tools ──
const riskTools: ToolDef[] = [
  {
    name: 'Portfolio Stress Test',
    inputs: [
      { key: 'portfolio', label: 'Portfolio Value', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'drawdown', label: 'Market Crash %', placeholder: '30', defaultVal: 30, suffix: '%' },
      { key: 'recovery', label: 'Recovery Growth %', placeholder: '20', defaultVal: 20, suffix: '%' },
      { key: 'recoveryYears', label: 'Recovery Years', placeholder: '3', defaultVal: 3, suffix: 'years' },
    ],
    compute: (v) => {
      const afterCrash = v.portfolio * (1 - v.drawdown / 100)
      const afterRecovery = afterCrash * (1 + v.recovery / 100) ** v.recoveryYears
      return [
        { label: 'After Crash', value: fmtCur(afterCrash) },
        { label: 'Loss Amount', value: fmtCur(v.portfolio - afterCrash) },
        { label: 'After Recovery', value: fmtCur(afterRecovery) },
        { label: 'Net Position', value: afterRecovery >= v.portfolio ? 'Recovered' : 'Still Down ' + fmtPct(((v.portfolio - afterRecovery) / v.portfolio) * 100) },
      ]
    },
  },
  {
    name: 'Scenario Simulator',
    inputs: [
      { key: 'investment', label: 'Investment Amount', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'bull', label: 'Bull Case Return', placeholder: '25', defaultVal: 25, suffix: '%' },
      { key: 'base', label: 'Base Case Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'bear', label: 'Bear Case Return', placeholder: '-15', defaultVal: -15, suffix: '%' },
      { key: 'years', label: 'Years', placeholder: '5', defaultVal: 5, suffix: 'years' },
    ],
    compute: (v) => {
      const bullFv = v.investment * (1 + v.bull / 100) ** v.years
      const baseFv = v.investment * (1 + v.base / 100) ** v.years
      const bearFv = v.investment * (1 + v.bear / 100) ** v.years
      return [
        { label: 'Bull Case', value: fmtCur(bullFv) },
        { label: 'Base Case', value: fmtCur(baseFv) },
        { label: 'Bear Case', value: fmtCur(bearFv) },
        { label: 'Range', value: fmtCur(bullFv - bearFv) },
      ]
    },
  },
  {
    name: 'Inflation Impact Simulator',
    inputs: [
      { key: 'amount', label: 'Current Amount', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'inflation', label: 'Inflation Rate', placeholder: '6', defaultVal: 6, suffix: '%' },
      { key: 'years', label: 'Years', placeholder: '20', defaultVal: 20, suffix: 'years' },
    ],
    compute: (v) => {
      const realValue = v.amount / (1 + v.inflation / 100) ** v.years
      const purchasingPowerLoss = v.amount - realValue
      return [
        { label: 'Real Value in ' + v.years + ' Years', value: fmtCur(realValue) },
        { label: 'Purchasing Power Lost', value: fmtCur(purchasingPowerLoss) },
        { label: 'Lost %', value: fmtPct((purchasingPowerLoss / v.amount) * 100) },
      ]
    },
  },
  {
    name: 'Diversification Analyzer',
    inputs: [
      { key: 'equity', label: 'Equity Allocation', placeholder: '60', defaultVal: 60, suffix: '%' },
      { key: 'debt', label: 'Debt Allocation', placeholder: '25', defaultVal: 25, suffix: '%' },
      { key: 'gold', label: 'Gold Allocation', placeholder: '10', defaultVal: 10, suffix: '%' },
      { key: 'realestate', label: 'Real Estate Allocation', placeholder: '5', defaultVal: 5, suffix: '%' },
    ],
    compute: (v) => {
      const total = v.equity + v.debt + v.gold + v.realestate
      const expectedReturn = (v.equity * 12 + v.debt * 7 + v.gold * 8 + v.realestate * 9) / total
      const riskScore = (v.equity * 8 + v.debt * 2 + v.gold * 5 + v.realestate * 6) / total
      return [
        { label: 'Total Allocation', value: fmtPct(total) },
        { label: 'Expected Return', value: fmtPct(expectedReturn) },
        { label: 'Risk Score (1-10)', value: riskScore.toFixed(1) },
        { label: 'Diversification', value: total === 100 ? 'Balanced' : 'Adjust to 100%' },
      ]
    },
  },
  {
    name: 'Monte Carlo Investment Simulation',
    inputs: [
      { key: 'initial', label: 'Initial Investment', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'mean', label: 'Avg Annual Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'stddev', label: 'Std Deviation', placeholder: '18', defaultVal: 18, suffix: '%' },
      { key: 'years', label: 'Years', placeholder: '10', defaultVal: 10, suffix: 'years' },
    ],
    compute: (v) => {
      const optimistic = v.initial * (1 + (v.mean + v.stddev) / 100) ** v.years
      const expected = v.initial * (1 + v.mean / 100) ** v.years
      const pessimistic = v.initial * (1 + Math.max(-50, v.mean - v.stddev) / 100) ** v.years
      return [
        { label: 'Optimistic (+1\u03C3)', value: fmtCur(optimistic) },
        { label: 'Expected (Mean)', value: fmtCur(expected) },
        { label: 'Pessimistic (-1\u03C3)', value: fmtCur(pessimistic) },
      ]
    },
  },
]

// ── 8. Forex & Commodity Tools ──
const forexTools: ToolDef[] = [
  {
    name: 'Currency Converter',
    inputs: [
      { key: 'amount', label: 'Amount', placeholder: '100000', defaultVal: 100000, prefix: '\u20B9' },
      { key: 'rate', label: 'Exchange Rate (INR per USD)', placeholder: '83.5', defaultVal: 83.5 },
    ],
    compute: (v) => {
      const usd = v.amount / v.rate
      return [
        { label: 'USD Equivalent', value: '$' + fmt(usd) },
        { label: 'INR Amount', value: fmtCur(v.amount) },
      ]
    },
  },
  {
    name: 'Forex Profit Calculator',
    inputs: [
      { key: 'entryRate', label: 'Entry Rate', placeholder: '83.00', defaultVal: 83.00 },
      { key: 'exitRate', label: 'Exit Rate', placeholder: '83.50', defaultVal: 83.50 },
      { key: 'lotSize', label: 'Lot Size (units)', placeholder: '100000', defaultVal: 100000 },
    ],
    compute: (v) => {
      const pips = (v.exitRate - v.entryRate) * 10000
      const profit = (v.exitRate - v.entryRate) * v.lotSize
      return [
        { label: 'Pips', value: fmt(pips) },
        { label: 'Profit/Loss', value: fmtCur(profit) },
      ]
    },
  },
  {
    name: 'Pip Value Calculator',
    inputs: [
      { key: 'lotSize', label: 'Lot Size', placeholder: '100000', defaultVal: 100000 },
      { key: 'rate', label: 'Exchange Rate', placeholder: '83.5', defaultVal: 83.5 },
    ],
    compute: (v) => {
      const pipValue = v.lotSize * 0.0001
      return [
        { label: 'Pip Value', value: fmtCur(pipValue) },
        { label: 'Value per 10 Pips', value: fmtCur(pipValue * 10) },
      ]
    },
  },
  {
    name: 'Commodity Margin Calculator',
    inputs: [
      { key: 'price', label: 'Commodity Price', placeholder: '60000', defaultVal: 60000, prefix: '\u20B9' },
      { key: 'lotSize', label: 'Lot Size', placeholder: '100', defaultVal: 100 },
      { key: 'marginPct', label: 'Margin %', placeholder: '5', defaultVal: 5, suffix: '%' },
    ],
    compute: (v) => {
      const contractValue = v.price * v.lotSize
      const margin = contractValue * v.marginPct / 100
      return [
        { label: 'Contract Value', value: fmtCur(contractValue) },
        { label: 'Margin Required', value: fmtCur(margin) },
        { label: 'Leverage', value: (100 / v.marginPct).toFixed(1) + 'x' },
      ]
    },
  },
  {
    name: 'Gold Investment Calculator',
    inputs: [
      { key: 'grams', label: 'Gold (Grams)', placeholder: '100', defaultVal: 100 },
      { key: 'buyPrice', label: 'Buy Price/Gram', placeholder: '6000', defaultVal: 6000, prefix: '\u20B9' },
      { key: 'currentPrice', label: 'Current Price/Gram', placeholder: '7200', defaultVal: 7200, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const invested = v.grams * v.buyPrice
      const current = v.grams * v.currentPrice
      const profit = current - invested
      return [
        { label: 'Invested', value: fmtCur(invested) },
        { label: 'Current Value', value: fmtCur(current) },
        { label: 'Profit', value: fmtCur(profit) },
        { label: 'Return', value: fmtPct((profit / invested) * 100) },
      ]
    },
  },
  {
    name: 'Crude Oil P/L Calculator',
    inputs: [
      { key: 'entry', label: 'Entry Price', placeholder: '5800', defaultVal: 5800, prefix: '\u20B9' },
      { key: 'exit', label: 'Exit Price', placeholder: '6100', defaultVal: 6100, prefix: '\u20B9' },
      { key: 'lotSize', label: 'Lot Size (barrels)', placeholder: '100', defaultVal: 100 },
      { key: 'lots', label: 'Number of Lots', placeholder: '1', defaultVal: 1 },
    ],
    compute: (v) => {
      const pl = (v.exit - v.entry) * v.lotSize * v.lots
      return [
        { label: 'P/L', value: fmtCur(pl) },
        { label: 'Points Moved', value: fmt(v.exit - v.entry) },
      ]
    },
  },
  {
    name: 'Hedge Calculator',
    inputs: [
      { key: 'portfolio', label: 'Portfolio Value', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'hedgePct', label: 'Hedge Ratio', placeholder: '50', defaultVal: 50, suffix: '%' },
      { key: 'hedgeCost', label: 'Hedging Cost (Annual)', placeholder: '2', defaultVal: 2, suffix: '%' },
    ],
    compute: (v) => {
      const hedgedAmount = v.portfolio * v.hedgePct / 100
      const annualCost = hedgedAmount * v.hedgeCost / 100
      return [
        { label: 'Hedged Amount', value: fmtCur(hedgedAmount) },
        { label: 'Annual Hedging Cost', value: fmtCur(annualCost) },
        { label: 'Unhedged Exposure', value: fmtCur(v.portfolio - hedgedAmount) },
      ]
    },
  },
]

// ── 9. Advanced Investor Tools ──
const advancedTools: ToolDef[] = [
  {
    name: 'Sharpe Ratio Calculator',
    inputs: [
      { key: 'portfolioReturn', label: 'Portfolio Return', placeholder: '15', defaultVal: 15, suffix: '%' },
      { key: 'riskFree', label: 'Risk-Free Rate', placeholder: '6', defaultVal: 6, suffix: '%' },
      { key: 'stdDev', label: 'Portfolio Std Dev', placeholder: '12', defaultVal: 12, suffix: '%' },
    ],
    compute: (v) => {
      const sharpe = (v.portfolioReturn - v.riskFree) / v.stdDev
      return [
        { label: 'Sharpe Ratio', value: sharpe.toFixed(3) },
        { label: 'Quality', value: sharpe > 1 ? 'Excellent' : sharpe > 0.5 ? 'Good' : 'Below Average' },
      ]
    },
  },
  {
    name: 'Beta Calculator',
    inputs: [
      { key: 'stockReturn', label: 'Stock Return', placeholder: '18', defaultVal: 18, suffix: '%' },
      { key: 'marketReturn', label: 'Market Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'riskFree', label: 'Risk-Free Rate', placeholder: '6', defaultVal: 6, suffix: '%' },
    ],
    compute: (v) => {
      const beta = (v.stockReturn - v.riskFree) / (v.marketReturn - v.riskFree)
      return [
        { label: 'Beta', value: beta.toFixed(2) },
        { label: 'Volatility', value: beta > 1 ? 'Higher than Market' : beta === 1 ? 'Same as Market' : 'Lower than Market' },
      ]
    },
  },
  {
    name: 'Alpha Calculator',
    inputs: [
      { key: 'actual', label: 'Actual Return', placeholder: '18', defaultVal: 18, suffix: '%' },
      { key: 'beta', label: 'Beta', placeholder: '1.2', defaultVal: 1.2 },
      { key: 'market', label: 'Market Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'riskFree', label: 'Risk-Free Rate', placeholder: '6', defaultVal: 6, suffix: '%' },
    ],
    compute: (v) => {
      const expectedReturn = v.riskFree + v.beta * (v.market - v.riskFree)
      const alpha = v.actual - expectedReturn
      return [
        { label: 'Expected Return (CAPM)', value: fmtPct(expectedReturn) },
        { label: 'Alpha', value: fmtPct(alpha) },
        { label: 'Outperformance', value: alpha > 0 ? 'Yes' : 'No' },
      ]
    },
  },
  {
    name: 'Drawdown Analyzer',
    inputs: [
      { key: 'peak', label: 'Portfolio Peak Value', placeholder: '5000000', defaultVal: 5000000, prefix: '\u20B9' },
      { key: 'trough', label: 'Portfolio Low Value', placeholder: '3500000', defaultVal: 3500000, prefix: '\u20B9' },
    ],
    compute: (v) => {
      const drawdown = ((v.peak - v.trough) / v.peak) * 100
      const recoveryNeeded = ((v.peak / v.trough) - 1) * 100
      return [
        { label: 'Max Drawdown', value: fmtPct(drawdown) },
        { label: 'Loss Amount', value: fmtCur(v.peak - v.trough) },
        { label: 'Recovery Needed', value: fmtPct(recoveryNeeded) },
      ]
    },
  },
  {
    name: 'Portfolio Optimizer',
    inputs: [
      { key: 'equityReturn', label: 'Equity Return', placeholder: '14', defaultVal: 14, suffix: '%' },
      { key: 'equityRisk', label: 'Equity Risk', placeholder: '20', defaultVal: 20, suffix: '%' },
      { key: 'debtReturn', label: 'Debt Return', placeholder: '7', defaultVal: 7, suffix: '%' },
      { key: 'debtRisk', label: 'Debt Risk', placeholder: '4', defaultVal: 4, suffix: '%' },
    ],
    compute: (v) => {
      // Optimal equity allocation using simplified mean-variance
      const optimalEquity = Math.max(0, Math.min(100,
        ((v.equityReturn - v.debtReturn) * v.debtRisk ** 2) /
        (v.equityReturn * v.debtRisk ** 2 + v.debtReturn * v.equityRisk ** 2 - (v.equityReturn + v.debtReturn) * 0) * 100
      ))
      const portReturn = (optimalEquity * v.equityReturn + (100 - optimalEquity) * v.debtReturn) / 100
      return [
        { label: 'Optimal Equity %', value: fmtPct(optimalEquity) },
        { label: 'Optimal Debt %', value: fmtPct(100 - optimalEquity) },
        { label: 'Expected Portfolio Return', value: fmtPct(portReturn) },
      ]
    },
  },
  {
    name: 'Scenario Probability Simulator',
    inputs: [
      { key: 'investment', label: 'Investment', placeholder: '1000000', defaultVal: 1000000, prefix: '\u20B9' },
      { key: 'targetReturn', label: 'Target Return', placeholder: '15', defaultVal: 15, suffix: '%' },
      { key: 'avgReturn', label: 'Historical Avg Return', placeholder: '12', defaultVal: 12, suffix: '%' },
      { key: 'stdDev', label: 'Historical Std Dev', placeholder: '18', defaultVal: 18, suffix: '%' },
    ],
    compute: (v) => {
      // Simplified probability using normal distribution approximation
      const zScore = (v.targetReturn - v.avgReturn) / v.stdDev
      const probability = Math.max(0, Math.min(100, (1 - 0.5 * (1 + Math.sign(zScore) * Math.sqrt(1 - Math.exp(-2 * zScore * zScore / Math.PI)))) * 100))
      const targetValue = v.investment * (1 + v.targetReturn / 100)
      return [
        { label: 'Target Portfolio Value', value: fmtCur(targetValue) },
        { label: 'Z-Score', value: zScore.toFixed(2) },
        { label: 'Probability of Achieving', value: fmtPct(probability) },
      ]
    },
  },
]


/* ================================================================
   ALL CATEGORIES
   ================================================================ */
const CATEGORIES: ToolCategory[] = [
  { id: 'investment', icon: Calculator, label: 'Investment Calculators', color: '#D0021B', tools: investmentTools },
  { id: 'income', icon: Wallet, label: 'Income & Cash Flow', color: '#15803D', tools: incomeTools },
  { id: 'realestate', icon: Home, label: 'Real Estate Tools', color: '#EA580C', tools: realEstateTools },
  { id: 'trading', icon: LineChart, label: 'Trading & Market', color: '#1E40AF', tools: tradingTools },
  { id: 'wealth', icon: PiggyBank, label: 'Wealth Planning', color: '#7C3AED', tools: wealthTools },
  { id: 'tax', icon: Landmark, label: 'Tax & Compliance', color: '#0891B2', tools: taxTools },
  { id: 'risk', icon: Brain, label: 'Risk & Strategy', color: '#BE185D', tools: riskTools },
  { id: 'forex', icon: Globe, label: 'Forex & Commodity', color: '#CA8A04', tools: forexTools },
  { id: 'advanced', icon: Star, label: 'Advanced Investor', color: '#6D28D9', tools: advancedTools },
]

/* ================================================================
   INDIVIDUAL CALCULATOR COMPONENT
   ================================================================ */
function CalculatorCard({ tool, accentColor }: { tool: ToolDef; accentColor: string }) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    tool.inputs.forEach(inp => { init[inp.key] = inp.defaultVal })
    return init
  })
  const [expanded, setExpanded] = useState(false)

  const results = useMemo(() => {
    try { return tool.compute(values) } catch { return [] }
  }, [values, tool])

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
          <span className="font-semibold text-sm text-brand-black dark:text-white/90">{tool.name}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-brand-red transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-brand-red transition-colors" />
        )}
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 dark:border-white/5 pt-4">
          {/* Inputs */}
          <div className="grid gap-3 mb-4">
            {tool.inputs.map(inp => (
              <div key={inp.key}>
                <label className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1 block">
                  {inp.label}
                </label>
                <div className="relative">
                  {inp.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{inp.prefix}</span>
                  )}
                  <input
                    type="number"
                    value={values[inp.key]}
                    onChange={e => setValues(prev => ({ ...prev, [inp.key]: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm py-2 outline-none focus:border-brand-red transition-colors text-brand-black dark:text-white"
                    style={{ paddingLeft: inp.prefix ? '28px' : '12px', paddingRight: inp.suffix ? '52px' : '12px' }}
                    placeholder={inp.placeholder}
                    step={inp.step || 'any'}
                  />
                  {inp.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{inp.suffix}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-white/50">{r.label}</span>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState('investment')
  const [searchQuery, setSearchQuery] = useState('')
  const [marketTab, setMarketTab] = useState<'india' | 'us'>('india')

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!

  const filteredTools = searchQuery.trim()
    ? CATEGORIES.flatMap(cat =>
        cat.tools
          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(t => ({ tool: t, color: cat.color }))
      )
    : activeCat.tools.map(t => ({ tool: t, color: activeCat.color }))

  const totalTools = CATEGORIES.reduce((sum, cat) => sum + cat.tools.length, 0)

  return (
    <>
      {/* ── HERO SECTION ── */}
      <section
        className="relative min-h-[50vh] flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #030014 0%, #0a0020 40%, #0d0010 70%, #0a0a0a 100%)' }}
      >
        <SpaceHero variant="wormhole" />
        {/* Star field (fewer, decorative) */}
        {Array.from({ length: 30 }, (_, i) => {
          const positions = [
            { x: 5, y: 10 }, { x: 15, y: 30 }, { x: 25, y: 15 }, { x: 35, y: 55 }, { x: 45, y: 20 },
            { x: 55, y: 45 }, { x: 65, y: 12 }, { x: 75, y: 60 }, { x: 85, y: 25 }, { x: 95, y: 40 },
            { x: 10, y: 70 }, { x: 20, y: 80 }, { x: 30, y: 42 }, { x: 40, y: 75 }, { x: 50, y: 8 },
            { x: 60, y: 65 }, { x: 70, y: 35 }, { x: 80, y: 50 }, { x: 90, y: 18 }, { x: 3, y: 55 },
            { x: 12, y: 48 }, { x: 28, y: 88 }, { x: 42, y: 62 }, { x: 58, y: 78 }, { x: 72, y: 85 },
            { x: 88, y: 72 }, { x: 33, y: 5 }, { x: 52, y: 35 }, { x: 78, y: 15 }, { x: 92, y: 58 },
          ]
          const p = positions[i]
          return (
            <span
              key={i}
              className={`star ${i % 5 === 0 ? 'star-lg' : i % 3 === 0 ? 'star-md' : 'star-sm'}`}
              style={{ top: `${p.y}%`, left: `${p.x}%`, animationDelay: `${(i * 0.37) % 3}s` }}
            />
          )
        })}

        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 25% 50%, rgba(208, 2, 27, 0.08) 0%, transparent 60%)' }} />

        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-44 pb-16 text-center">
          <AnimatedSection delay={0}>
            <div className="inline-flex items-center px-4 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full mb-6 backdrop-blur-sm">
              <Calculator className="w-4 h-4 text-brand-red mr-2" />
              <span className="text-brand-red text-xs font-semibold uppercase tracking-widest">
                {totalTools}+ Professional Tools
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.08] mb-5 tracking-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
              Market Tools & <span className="text-gradient">Financial Calculators</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <p className="text-base text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              Professional-grade calculators for investments, trading, real estate, tax planning, and more.
              Every tool an Indian investor needs, in one place.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── TOOLS SECTION ── */}
      <section className="section-padding bg-brand-offwhite dark:bg-[#0A0A0A] min-h-screen">
        <div className="container-max mx-auto">

          {/* Search bar */}
          <div className="mb-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search calculators..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A1A] text-sm outline-none focus:border-brand-red transition-colors text-brand-black dark:text-white"
              />
            </div>
          </div>

          {/* Category pills */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                      isActive
                        ? 'text-white border-transparent shadow-lg'
                        : 'text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#1A1A1A]'
                    }`}
                    style={isActive ? { background: cat.color, boxShadow: `0 4px 20px ${cat.color}40` } : {}}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10'
                    }`}>
                      {cat.tools.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Search results header */}
          {searchQuery && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 dark:text-white/40">
                Found <span className="font-bold text-brand-red">{filteredTools.length}</span> tools matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}

          {/* Calculator cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map(({ tool, color }, i) => (
              <CalculatorCard key={tool.name} tool={tool} accentColor={color} />
            ))}
          </div>

          {/* Empty state */}
          {filteredTools.length === 0 && (
            <div className="text-center py-20">
              <Calculator className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-white/40">No calculators found. Try a different search term.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Live Market Data — Indian & US Indices ── */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Live Markets</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">Real-Time Market Data</h2>
            <p className="text-white/40 text-sm mt-2 max-w-lg mx-auto">
              Track Indian & US equities, commodities, and indices in real time.
            </p>
          </div>

          {/* Market Tab Switcher */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
              <button
                onClick={() => setMarketTab('india')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  marketTab === 'india' ? 'bg-brand-red text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                🇮🇳 Indian Indices
              </button>
              <button
                onClick={() => setMarketTab('us')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  marketTab === 'us' ? 'bg-brand-red text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                🇺🇸 US / NYSE Indices
              </button>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-green-400 text-[10px] font-semibold uppercase tracking-wider">Live Data</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50" style={{ height: '500px' }}>
            {marketTab === 'india' ? (
              <iframe
                key="tools-india-market"
                src="https://s.tradingview.com/embed-widget/market-quotes/?locale=en#%7B%22symbolsGroups%22%3A%5B%7B%22name%22%3A%22Indian%20Indices%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22BSE%3ASENSEX%22%2C%22displayName%22%3A%22SENSEX%22%7D%2C%7B%22name%22%3A%22NSE%3ANIFTY%22%2C%22displayName%22%3A%22NIFTY%2050%22%7D%2C%7B%22name%22%3A%22NSE%3ABANKNIFTY%22%2C%22displayName%22%3A%22BANK%20NIFTY%22%7D%2C%7B%22name%22%3A%22NSE%3ANIFTY_IT%22%2C%22displayName%22%3A%22NIFTY%20IT%22%7D%2C%7B%22name%22%3A%22NSE%3ANIFTY_FIN_SERVICE%22%2C%22displayName%22%3A%22NIFTY%20Financial%22%7D%2C%7B%22name%22%3A%22BSE%3ABSE500%22%2C%22displayName%22%3A%22BSE%20500%22%7D%5D%7D%2C%7B%22name%22%3A%22Indian%20Stocks%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22NSE%3ARELIANCE%22%2C%22displayName%22%3A%22Reliance%22%7D%2C%7B%22name%22%3A%22NSE%3ATCS%22%2C%22displayName%22%3A%22TCS%22%7D%2C%7B%22name%22%3A%22NSE%3AHDFCBANK%22%2C%22displayName%22%3A%22HDFC%20Bank%22%7D%2C%7B%22name%22%3A%22NSE%3AINFY%22%2C%22displayName%22%3A%22Infosys%22%7D%2C%7B%22name%22%3A%22NSE%3AICICIBANK%22%2C%22displayName%22%3A%22ICICI%20Bank%22%7D%2C%7B%22name%22%3A%22NSE%3ASBIN%22%2C%22displayName%22%3A%22SBI%22%7D%5D%7D%2C%7B%22name%22%3A%22Commodities%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22TVC%3AGOLD%22%2C%22displayName%22%3A%22Gold%22%7D%2C%7B%22name%22%3A%22TVC%3ASILVER%22%2C%22displayName%22%3A%22Silver%22%7D%2C%7B%22name%22%3A%22TVC%3AUSOIL%22%2C%22displayName%22%3A%22Crude%20Oil%22%7D%2C%7B%22name%22%3A%22FX_IDC%3AUSDINR%22%2C%22displayName%22%3A%22USD%2FINR%22%7D%5D%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22isTransparent%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D"
                title="Indian Market Data Live"
                className="w-full h-full border-0"
                loading="lazy"
              />
            ) : (
              <iframe
                key="tools-us-market"
                src="https://s.tradingview.com/embed-widget/market-quotes/?locale=en#%7B%22symbolsGroups%22%3A%5B%7B%22name%22%3A%22US%20Indices%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22FOREXCOM%3ASPXUSD%22%2C%22displayName%22%3A%22S%26P%20500%22%7D%2C%7B%22name%22%3A%22FOREXCOM%3ANSXUSD%22%2C%22displayName%22%3A%22NASDAQ%22%7D%2C%7B%22name%22%3A%22FOREXCOM%3ADJI%22%2C%22displayName%22%3A%22Dow%20Jones%22%7D%2C%7B%22name%22%3A%22INDEX%3ARUT%22%2C%22displayName%22%3A%22Russell%202000%22%7D%2C%7B%22name%22%3A%22INDEX%3AVIX%22%2C%22displayName%22%3A%22VIX%22%7D%2C%7B%22name%22%3A%22TVC%3ADXY%22%2C%22displayName%22%3A%22US%20Dollar%20Index%22%7D%5D%7D%2C%7B%22name%22%3A%22US%20Stocks%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22NASDAQ%3AAAPL%22%2C%22displayName%22%3A%22Apple%22%7D%2C%7B%22name%22%3A%22NASDAQ%3AMSFT%22%2C%22displayName%22%3A%22Microsoft%22%7D%2C%7B%22name%22%3A%22NASDAQ%3AAMZN%22%2C%22displayName%22%3A%22Amazon%22%7D%2C%7B%22name%22%3A%22NASDAQ%3AGOOGL%22%2C%22displayName%22%3A%22Google%22%7D%2C%7B%22name%22%3A%22NASDAQ%3ANVDA%22%2C%22displayName%22%3A%22NVIDIA%22%7D%2C%7B%22name%22%3A%22NASDAQ%3ATSLA%22%2C%22displayName%22%3A%22Tesla%22%7D%5D%7D%2C%7B%22name%22%3A%22Global%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22TVC%3AGOLD%22%2C%22displayName%22%3A%22Gold%22%7D%2C%7B%22name%22%3A%22TVC%3AUSOIL%22%2C%22displayName%22%3A%22Crude%20Oil%22%7D%2C%7B%22name%22%3A%22FX_IDC%3AEURUSD%22%2C%22displayName%22%3A%22EUR%2FUSD%22%7D%2C%7B%22name%22%3A%22BITSTAMP%3ABTCUSD%22%2C%22displayName%22%3A%22Bitcoin%22%7D%5D%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22isTransparent%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D"
                title="US Market Data Live"
                className="w-full h-full border-0"
                loading="lazy"
              />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
