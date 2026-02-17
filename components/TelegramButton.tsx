'use client'

import { useState } from 'react'
import { BRAND } from '@/lib/constants'

export default function TelegramButton() {
  const [hovered, setHovered] = useState(false)

  const telegramUrl = 'https://t.me/ghlindia'

  return (
    <div className="fixed z-[9998] flex items-center" style={{ bottom: '80px', right: '24px' }}>
      {/* Tooltip */}
      <div
        className={`mr-3 px-4 py-2 bg-white rounded-lg shadow-lg text-sm font-medium text-brand-black whitespace-nowrap transition-all duration-300 ${
          hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        Chat on Telegram
        {/* Tooltip arrow */}
        <div className="absolute top-1/2 right-0 translate-x-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
      </div>

      {/* Button */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0088cc] hover:bg-[#006daa] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Chat on Telegram"
      >
        {/* Telegram SVG icon */}
        <svg
          className="relative z-10 w-6 h-6 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </a>
    </div>
  )
}
