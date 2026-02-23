'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
  /** Theme: 'dark' for admin/staff portals, 'light' for client/public */
  theme?: 'dark' | 'light'
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      const isDark = this.props.theme === 'dark'

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isDark
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-red-50 border border-red-200'
            }`}>
              <AlertTriangle className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            </div>
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-white bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30'
                    : 'text-white bg-[#D0021B] hover:bg-[#B00218] border border-[#D0021B]'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10'
                    : 'text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Home className="w-4 h-4" />
                Go Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
