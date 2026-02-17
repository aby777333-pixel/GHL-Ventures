'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight, ArrowLeft, Target, CheckCircle, RotateCcw, Sparkles } from 'lucide-react'
import { QUIZ_QUESTIONS, getProfile, type RiskProfile } from '@/lib/quizData'

interface RiskAssessmentQuizProps {
  isOpen: boolean
  onClose: () => void
}

export default function RiskAssessmentQuiz({ isOpen, onClose }: RiskAssessmentQuizProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<RiskProfile | null>(null)
  const [animating, setAnimating] = useState(false)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setAnswers([])
      setResult(null)
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers]
    newAnswers[currentStep] = score
    setAnswers(newAnswers)

    setAnimating(true)
    setTimeout(() => {
      if (currentStep < QUIZ_QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        // Calculate result
        const totalScore = newAnswers.reduce((sum, s) => sum + s, 0)
        setResult(getProfile(totalScore))
      }
      setAnimating(false)
    }, 300)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setAnswers([])
    setResult(null)
  }

  const totalScore = answers.reduce((sum, s) => sum + s, 0)
  const progress = result
    ? 100
    : ((currentStep) / QUIZ_QUESTIONS.length) * 100

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
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
          aria-label="Close quiz"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-brand-red transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {!result ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Risk Assessment Quiz</h3>
                  <p className="text-gray-500 text-xs">
                    Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
                  </p>
                </div>
              </div>

              {/* Question */}
              <div className={`transition-all duration-300 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <h4 className="text-white text-base font-semibold mb-5 leading-relaxed">
                  {QUIZ_QUESTIONS[currentStep].question}
                </h4>

                {/* Options */}
                <div className="space-y-2.5">
                  {QUIZ_QUESTIONS[currentStep].options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(option.score)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 text-sm group ${
                        answers[currentStep] === option.score
                          ? 'border-brand-red bg-brand-red/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-brand-red/50 hover:bg-brand-red/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold transition-colors ${
                          answers[currentStep] === option.score
                            ? 'border-brand-red bg-brand-red text-white'
                            : 'border-white/20 text-gray-500 group-hover:border-brand-red/40'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="leading-snug">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1.5 text-gray-500 text-xs font-medium hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <div className="flex gap-1">
                  {QUIZ_QUESTIONS.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentStep
                          ? 'bg-brand-red'
                          : i < currentStep && answers[i] !== undefined
                          ? 'bg-brand-red/50'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ── Result Screen ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{ background: `${result.color}20`, border: `2px solid ${result.color}` }}
              >
                <Sparkles className="w-7 h-7" style={{ color: result.color }} />
              </div>

              <h3 className="text-white text-xl font-bold mb-1">Your Risk Profile</h3>
              <div
                className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mt-2 mb-4"
                style={{ backgroundColor: `${result.color}20`, color: result.color }}
              >
                {result.name} Investor
              </div>
              <p className="text-gray-400 text-sm mb-2">
                Score: {totalScore} / {QUIZ_QUESTIONS.length * 4}
              </p>

              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {result.description}
              </p>

              {/* Recommendation Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-white text-sm font-semibold">Our Recommendation</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {result.recommendation}
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={result.routeLink}
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)' }}
                >
                  Explore {result.route} <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleRestart}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                </button>
              </div>

              <p className="text-gray-600 text-[10px] mt-5 leading-relaxed">
                This quiz provides indicative guidance only and does not constitute investment advice.
                Please consult a qualified financial advisor before making investment decisions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
