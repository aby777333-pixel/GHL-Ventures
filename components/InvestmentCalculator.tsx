'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Calculator, TrendingUp, IndianRupee, BarChart3, Layers } from 'lucide-react'
import {
  calculateSIP,
  calculateDebenture,
  calculateAIF,
  formatINR,
  COMPARISON_BENCHMARKS,
  type CalculationResult,
} from '@/lib/calculatorUtils'

type CalcTab = 'sip' | 'debenture' | 'aif' | 'compare'

interface InvestmentCalculatorProps {
  isOpen: boolean
  onClose: () => void
}

function ResultCard({ result, label }: { result: CalculationResult; label: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-5">
      <div className="text-center mb-4">
        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label} Returns</p>
        <p className="text-white text-2xl font-bold">{formatINR(result.total)}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Invested</p>
          <p className="text-gray-300 text-sm font-semibold">{formatINR(result.invested)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">Returns</p>
          <p className="text-green-400 text-sm font-semibold">+{formatINR(result.returns)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">CAGR</p>
          <p className="text-brand-red text-sm font-semibold">{result.cagr.toFixed(1)}%</p>
        </div>
      </div>
      {/* Visual bar */}
      <div className="mt-4 flex rounded-full overflow-hidden h-3">
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${(result.invested / result.total) * 100}%` }}
          title="Invested Amount"
        />
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${(result.returns / result.total) * 100}%` }}
          title="Returns"
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-gray-500">
        <span>Invested</span>
        <span>Returns</span>
      </div>
    </div>
  )
}

export default function InvestmentCalculator({ isOpen, onClose }: InvestmentCalculatorProps) {
  const [activeTab, setActiveTab] = useState<CalcTab>('sip')

  // SIP state
  const [sipAmount, setSipAmount] = useState(25000)
  const [sipYears, setSipYears] = useState(5)
  const [sipRate, setSipRate] = useState(15)

  // Debenture state
  const [debAmount, setDebAmount] = useState(1000000)
  const [debYears, setDebYears] = useState(3)
  const [debRate, setDebRate] = useState(14)

  // AIF state
  const [aifAmount, setAifAmount] = useState(10000000)
  const [aifYears, setAifYears] = useState(5)
  const [aifIRR, setAifIRR] = useState(20)

  // Compare state
  const [compareAmount, setCompareAmount] = useState(10000000)
  const [compareYears, setCompareYears] = useState(5)

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sipResult = useMemo(() => calculateSIP(sipAmount, sipYears, sipRate), [sipAmount, sipYears, sipRate])
  const debResult = useMemo(() => calculateDebenture(debAmount, debYears, debRate), [debAmount, debYears, debRate])
  const aifResult = useMemo(() => calculateAIF(aifAmount, aifYears, aifIRR), [aifAmount, aifYears, aifIRR])

  const compareResults = useMemo(() => {
    return COMPARISON_BENCHMARKS.map(b => ({
      ...b,
      total: compareAmount * Math.pow(1 + b.rate / 100, compareYears),
    }))
  }, [compareAmount, compareYears])

  const maxCompareTotal = useMemo(() => Math.max(...compareResults.map(r => r.total)), [compareResults])

  const tabs: { key: CalcTab; label: string; icon: typeof Calculator }[] = [
    { key: 'sip', label: 'SIP', icon: TrendingUp },
    { key: 'debenture', label: 'Debenture', icon: IndianRupee },
    { key: 'aif', label: 'AIF', icon: BarChart3 },
    { key: 'compare', label: 'Compare', icon: Layers },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto"
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors p-1"
          aria-label="Close calculator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold">Investment Calculator</h3>
              <p className="text-gray-500 text-xs">Estimate your potential returns</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab.key
                    ? 'text-brand-red border-b-2 border-brand-red'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* SIP Tab */}
          {activeTab === 'sip' && (
            <div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Monthly SIP Amount</span>
                    <span className="text-white font-semibold">{formatINR(sipAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={500000}
                    step={5000}
                    value={sipAmount}
                    onChange={e => setSipAmount(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>₹5K</span><span>₹5L</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{sipYears} years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={sipYears}
                    onChange={e => setSipYears(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>1 yr</span><span>20 yrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Expected Return (p.a.)</span>
                    <span className="text-white font-semibold">{sipRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={sipRate}
                    onChange={e => setSipRate(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>5%</span><span>30%</span>
                  </div>
                </div>
              </div>
              <ResultCard result={sipResult} label="SIP" />
            </div>
          )}

          {/* Debenture Tab */}
          {activeTab === 'debenture' && (
            <div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Investment Amount</span>
                    <span className="text-white font-semibold">{formatINR(debAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={10000000}
                    step={100000}
                    value={debAmount}
                    onChange={e => setDebAmount(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>₹10L</span><span>₹1Cr</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{debYears} years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    step={1}
                    value={debYears}
                    onChange={e => setDebYears(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>1 yr</span><span>7 yrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Expected Return (p.a.)</span>
                    <span className="text-white font-semibold">{debRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={20}
                    step={1}
                    value={debRate}
                    onChange={e => setDebRate(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>10%</span><span>20%</span>
                  </div>
                </div>
              </div>
              <ResultCard result={debResult} label="Debenture" />
            </div>
          )}

          {/* AIF Tab */}
          {activeTab === 'aif' && (
            <div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Investment Amount</span>
                    <span className="text-white font-semibold">{formatINR(aifAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={10000000}
                    max={250000000}
                    step={5000000}
                    value={aifAmount}
                    onChange={e => setAifAmount(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>₹1Cr</span><span>₹25Cr</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{aifYears} years</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    step={1}
                    value={aifYears}
                    onChange={e => setAifYears(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>3 yrs</span><span>10 yrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Target IRR</span>
                    <span className="text-white font-semibold">{aifIRR}%</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={30}
                    step={1}
                    value={aifIRR}
                    onChange={e => setAifIRR(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>12%</span><span>30%</span>
                  </div>
                </div>
              </div>
              <ResultCard result={aifResult} label="AIF" />
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div>
              <div className="space-y-5 mb-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Investment Amount</span>
                    <span className="text-white font-semibold">{formatINR(compareAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={100000000}
                    step={1000000}
                    value={compareAmount}
                    onChange={e => setCompareAmount(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{compareYears} years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={compareYears}
                    onChange={e => setCompareYears(Number(e.target.value))}
                    className="w-full accent-brand-red"
                  />
                </div>
              </div>

              {/* Comparison bars */}
              <div className="space-y-3">
                {compareResults.map(b => (
                  <div key={b.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{b.name} ({b.rate}%)</span>
                      <span className="text-white font-semibold">{formatINR(b.total)}</span>
                    </div>
                    <div className="h-6 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max((b.total / maxCompareTotal) * 100, 8)}%`,
                          backgroundColor: b.color,
                        }}
                      >
                        <span className="text-white text-[9px] font-bold">
                          +{formatINR(b.total - compareAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-500 text-[10px]">
                  Initial: {formatINR(compareAmount)} | Duration: {compareYears} yrs
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-gray-600 text-[9px] text-center mt-5 leading-relaxed">
            For illustration purposes only. Past performance is not indicative of future results.
            Actual returns may vary. Consult your financial advisor before investing.
          </p>
        </div>
      </div>
    </div>
  )
}
