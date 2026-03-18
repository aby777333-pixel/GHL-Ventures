'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles, Phone, Mail, ArrowRight, ExternalLink } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
}

// ---------------------------------------------------------------------------
// Response Library
// ---------------------------------------------------------------------------
function getResponse(input: string): string {
  const lower = input.toLowerCase()

  // About GHL
  if (lower.includes('what is ghl') || lower.includes('tell me about ghl') || lower.includes('who are you') || lower.includes('about ghl')) {
    return "GHL India Ventures is a SEBI-registered Category II Alternate Investment Fund\u2014think of us as a carefully curated gateway for sophisticated investors to access opportunities that aren\u2019t available through regular markets.\n\nWe focus on two spaces: **stressed real estate** in India, and **early-stage startups** with strong fundamentals.\n\nOur registration (IN/AIF2/2425/1517) means we operate under SEBI\u2019s full regulatory framework.\n\nWe\u2019re based in Chennai, but our thinking is pan-India. Would you like to know more about how we invest?"
  }

  // AIF
  if (lower.includes('what is aif') || lower.includes('alternative investment') || lower.includes('aif')) {
    return "An AIF\u2014Alternate Investment Fund\u2014is a privately pooled investment vehicle registered with SEBI that invests in assets beyond traditional stocks and bonds.\n\nCategory II AIFs like ours can invest in private equity, real estate, and other alternative assets\u2014without leverage.\n\nSEBI established this framework in 2012 for structure, accountability, and investor protection.\n\nWould you like our downloadable Investment Guide? It explains AIFs in plain English."
  }

  // Minimum investment
  if (lower.includes('minimum investment') || lower.includes('how much') || lower.includes('minimum')) {
    return "The minimum investment is as per SEBI\u2019s guidelines for Category II AIFs designed for High Net Worth Individuals.\n\nFor investors who meet this threshold, the access you get\u2014quality deals, due diligence, professional management\u2014would cost far more independently.\n\nWould you like to know the investment journey once you decide to proceed?"
  }

  // How to invest / process
  if (lower.includes('how to invest') || lower.includes('start investing') || lower.includes('process') || lower.includes('how do i invest')) {
    return "Here\u2019s how it typically unfolds:\n\n**Step 1** \u2014 Connect: Reach out through this site, WhatsApp, or schedule a call.\n**Step 2** \u2014 Know Your Fit: Our advisors walk you through strategy and risk profile.\n**Step 3** \u2014 KYC & Documentation: PAN, Aadhaar, bank details, accreditation.\n**Step 4** \u2014 Subscription: Formally subscribe to the fund.\n**Step 5** \u2014 Ongoing Transparency: Regular updates, NAV reports, direct access.\n\nWould you like to schedule a call with our advisory team?"
  }

  // Returns / performance
  if (lower.includes('returns') || lower.includes('performance') || lower.includes('irr')) {
    return "I want to be honest\u2014we don\u2019t promise returns. No responsible investment manager does.\n\nWhat we can share is our **target IRR framework**. Stressed real estate and early-stage startups have shown strong risk-adjusted returns over medium-to-long horizons.\n\nEvery investment goes through a rigorous IC process. We only deploy capital when due diligence supports a clear thesis.\n\n*This is educational information\u2014for advice specific to your situation, our advisors are here.*\n\nWould you like to connect with our team?"
  }

  // Safety / risk
  if (lower.includes('safe') || lower.includes('risk') || lower.includes('security')) {
    return "That\u2019s the most important question you could ask.\n\nGHL India Ventures is SEBI-registered, operating under India\u2019s strictest regulatory framework. Our fund structure, disclosures, and protections are mandated and monitored.\n\nAll investments carry risk\u2014we\u2019d never say otherwise. What we promise is **transparency**: you\u2019ll always know where your money is and why.\n\nOur risk management includes portfolio diversification, meticulous due diligence, and IC process before deployment.\n\nWould you like to speak with an advisor about this?"
  }

  // Real estate
  if (lower.includes('stressed real estate') || lower.includes('real estate') || lower.includes('property')) {
    return "Stressed real estate is where some of the most compelling risk-adjusted returns in India are being created right now.\n\nWhen projects face distress\u2014developer insolvency, stalled construction\u2014the underlying assets often trade at significant discounts. Our team applies thorough due diligence and works to unlock value through resolution or strategic acquisition.\n\nSEBI\u2019s Category II AIF framework is specifically designed for this kind of sophisticated investing.\n\nWe have a detailed article on our blog\u2014shall I find it for you?"
  }

  // Team / leadership
  if (lower.includes('team') || lower.includes('who') || lower.includes('founders') || lower.includes('leadership')) {
    return "Our team has deep roots in Indian finance, real estate, and early-stage venture\u2014people who\u2019ve seen both sides of the investment table.\n\nLed by our Founder & MD with 25+ years in financial services, the team brings expertise across investment banking, real estate, and startups.\n\nYou can meet everyone on our About page. Would you like me to take you there?"
  }

  // Contact
  if (lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('address')) {
    return "Here\u2019s how to reach us:\n\n**Phone:** +91 44 2843 1043 | +91 7200 255 252\n**Email:** info@ghlindia.com\n**Office:** 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai \u2013 600 008\n**Hours:** Mon\u2013Fri, 9:30 AM \u2013 6:30 PM IST\n\nYou can also chat with us on WhatsApp. Would you like me to connect you?"
  }

  // SEBI / registration
  if (lower.includes('sebi') || lower.includes('registered') || lower.includes('regulation')) {
    return "We are registered with SEBI as a Category II AIF: **IN/AIF2/2425/1517**.\n\nThis means full regulatory oversight, mandatory disclosures, and investor protection under SEBI (AIF) Regulations, 2012.\n\nFor any regulatory concerns, SEBI\u2019s SCORES portal at scores.gov.in is also available.\n\nWhat else would you like to know?"
  }

  // Complaints
  if (lower.includes('complaint') || lower.includes('issue') || lower.includes('problem')) {
    return "I\u2019m sorry to hear that. Our team takes concerns very seriously.\n\n+91 44 2843 1043 | +91 7200 255 252\ninfo@ghlindia.com\n2D, Queens Court, Egmore, Chennai \u2013 600 008\n\nAs a SEBI-registered entity, you can also escalate to **SEBI SCORES** at scores.gov.in.\n\nI hope we can resolve this quickly."
  }

  // Video call — handled by component (dispatches event + minimizes ARIA so widget is visible)
  if (lower.includes('video call') || lower.includes('video chat') || lower.includes('start video') || lower.includes('video meeting') || lower.includes('video consultation')) {
    return "Opening the **Video Call** widget for you! You can connect with our Sales & Support team directly from your browser.\n\nJust fill in your details and our team will be with you shortly.\n\n*ARIA will minimize so the Video Call panel is fully visible.*"
  }

  // Web call / browser call / click to call
  if (lower.includes('web call') || lower.includes('browser call') || lower.includes('click to call') || lower.includes('webrtc') || lower.includes('call from browser') || lower.includes('online call')) {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ghl-show-solutions'))
        const dcBtn = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (dcBtn) dcBtn.click()
      }, 600)
    }
    return "Opening our **Web Calling Solutions** panel for you!\n\nYou can make calls directly from your browser using:\n\n**JustCall** — Cloud phone with WebRTC, 100+ integrations\n**Aircall** — Cloud-based VoIP with real-time analytics\n**Toky** — Click-to-call widget with SMS & CRM integration\n**Telnyx** — Developer-friendly SIP/WebRTC APIs\n**Vonage** — Programmable voice with global coverage\n**Exotel** — India-focused cloud telephony\n\n*The calling solutions panel should now be open.*"
  }

  // Live chat — redirect to GHL's built-in chat
  if (lower.includes('live chat') || lower.includes('chat widget') || lower.includes('free chat') || lower.includes('live support') || lower.includes('chat solution') || lower.includes('customer chat') || lower.includes('chat tool')) {
    return `GHL India Ventures has a **built-in live chat** system powered by our own platform.

You can switch to **Live Chat** mode using the toggle above to connect with a real agent instantly.

Our system includes:
• **Real-time messaging** with typing indicators
• **Relationship Manager** transfer
• **Customer satisfaction** ratings
• **Full chat history** persistence

Say **"Live Chat"** to connect with an agent now, or say **"Web Call"** for browser-based calling.`
  }

  // Crisp specific
  if (lower.includes('crisp')) {
    return "**Crisp** is an all-in-one messaging platform with a generous free tier.\n\n• Free plan includes **2 agent seats**\n• Live chat widget + shared inbox\n• Built-in chatbot (basic)\n• Knowledge base\n• Mobile apps\n\nVisit: **crisp.chat** to get started."
  }

  // Tidio specific
  if (lower.includes('tidio')) {
    return "**Tidio** combines live chat with AI-powered chatbots.\n\n• Free plan: **50 conversations/month**\n• AI chatbot builder (Lyro AI)\n• Shopify, WordPress, Wix plugins\n• Email integration\n• Visitor tracking\n\nVisit: **tidio.com** to try it free."
  }

  // Human / advisor
  if (lower.includes('human') || lower.includes('speak') || lower.includes('advisor') || lower.includes('call') || lower.includes('talk to')) {
    return "Of course! Our advisors are ready to help.\n\n**Call:** +91 7200 255 252\n**Email:** info@ghlindia.com\n**WhatsApp:** +91 7200 255 252\n\nYou can also say **\"video call\"** to open our Video Call widget right here!\n\nOr visit our Contact page to schedule a consultation at your convenience.\n\nThey typically respond within 2 business hours."
  }

  // Default
  return "That\u2019s a question I want to answer properly\u2014let me make sure I get it right.\n\nI can help with questions about our fund, investment process, SEBI regulations, or connect you with our advisory team.\n\nTry asking about:\n\u2022 Our investment strategy\n\u2022 How to start investing\n\u2022 SEBI registration details\n\u2022 Contact information\n\nOr I can connect you with a human advisor right away."
}

// ---------------------------------------------------------------------------
// Render message text with **bold** support
// ---------------------------------------------------------------------------
function renderFormattedText(text: string) {
  // Split on new-lines first, then handle bold markers
  return text.split('\n').map((line, lineIdx) => {
    // Split by **...**
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const elements = parts.map((part, partIdx) => {
      // Odd indices are the captured groups (bold content)
      if (partIdx % 2 === 1) {
        return <strong key={partIdx} className="font-semibold text-white">{part}</strong>
      }
      // Handle *italic* within non-bold parts
      const italicParts = part.split(/\*(.*?)\*/g)
      if (italicParts.length > 1) {
        return italicParts.map((ip, ipIdx) => {
          if (ipIdx % 2 === 1) {
            return <em key={`${partIdx}-${ipIdx}`} className="italic text-gray-400">{ip}</em>
          }
          return <span key={`${partIdx}-${ipIdx}`}>{ip}</span>
        })
      }
      return part
    })

    return (
      <span key={lineIdx}>
        {lineIdx > 0 && <br />}
        {elements}
      </span>
    )
  })
}

// ---------------------------------------------------------------------------
// Unique ID generator
// ---------------------------------------------------------------------------
let msgCounter = 0
function uid(): string {
  return `msg-${Date.now()}-${++msgCounter}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AriaChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showProactive, setShowProactive] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [showPulse, setShowPulse] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Welcome message
  const WELCOME_MESSAGE =
    "Hello! I\u2019m ARIA, GHL India Ventures\u2019 AI guide. I\u2019m here to help you understand our fund, answer your investment questions, and guide you to the right people\u2014honestly and clearly.\n\nWhat\u2019s on your mind today?"

  const QUICK_REPLIES = [
    'What is an AIF?',
    'How do I invest?',
    'Tell me about GHL',
    'Start a Video Call',
    'Live Chat Widgets',
    'Web Call',
    'Talk to a human',
  ]

  // ---------- Proactive bubble ----------
  useEffect(() => {
    proactiveTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        setShowProactive(true)
        dismissTimerRef.current = setTimeout(() => {
          setShowProactive(false)
        }, 6000)
      }
    }, 8000)

    return () => {
      if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Auto-scroll ----------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ---------- Focus input on open ----------
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // ---------- Open handler ----------
  const handleOpen = useCallback(() => {
    setShowProactive(false)
    setShowPulse(false)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current)

    if (!hasOpened) {
      setMessages([{ id: uid(), role: 'bot', text: WELCOME_MESSAGE }])
      setHasOpened(true)
    }
    setIsOpen(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOpened])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // ---------- Send message ----------
  const handleSend = useCallback((text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return

    const userMsg: Message = { id: uid(), role: 'user', text: content }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Detect video call intent
    const lower = content.toLowerCase()
    const isVideoCall = lower.includes('video call') || lower.includes('video chat') || lower.includes('start video') || lower.includes('video meeting') || lower.includes('video consultation')

    setTimeout(() => {
      const botMsg: Message = { id: uid(), role: 'bot', text: getResponse(content) }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)

      // If video call requested → minimize ARIA, then open video widget
      if (isVideoCall && typeof window !== 'undefined') {
        setTimeout(() => {
          setIsOpen(false) // Minimize ARIA (z-9999) so VideoCallWidget (z-9997) is visible
          window.dispatchEvent(new CustomEvent('ghl-open-video-call'))
        }, 1200)
      }
    }, 800 + Math.random() * 700)
  }, [input])

  const handleQuickReply = useCallback((text: string) => {
    handleSend(text)
  }, [handleSend])

  const showQuickReplies = messages.length === 1 && messages[0].role === 'bot' && !isTyping

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <>
      {/* ================================================================
          COLLAPSED STATE - Avatar with rotating ring
          ================================================================ */}
      <div
        className="fixed z-[9999]"
        style={{ bottom: '100px', right: '24px' }}
      >
        {/* Proactive speech bubble */}
        {showProactive && !isOpen && (
          <div
            className="absolute bottom-[84px] right-0 animate-fade-in"
            style={{ width: '260px' }}
          >
            <div
              className="relative rounded-2xl px-4 py-3 text-[13px] leading-relaxed text-white"
              style={{
                background: 'rgba(10,10,10,0.92)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(208,2,27,0.25)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}
            >
              Hi there! I&apos;m ARIA. Want to know how GHL&apos;s AIF works? I&apos;m happy to explain.
              {/* Triangle pointer */}
              <div
                className="absolute -bottom-2 right-6 w-4 h-4 rotate-45"
                style={{
                  background: 'rgba(10,10,10,0.92)',
                  borderRight: '1px solid rgba(208,2,27,0.25)',
                  borderBottom: '1px solid rgba(208,2,27,0.25)',
                }}
              />
            </div>
          </div>
        )}

        {/* Label: "ARIA – GHL Help" beside the widget */}
        {!isOpen && (
          <div
            className="absolute top-1/2 -translate-y-1/2 animate-fade-in"
            style={{ right: '82px', pointerEvents: 'none' }}
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap"
              style={{
                background: 'rgba(10,10,10,0.9)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(208,2,27,0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <span className="text-brand-red font-bold text-[11px]">ARIA</span>
              <span className="text-gray-500">&ndash;</span>
              <span className="text-gray-300 font-semibold">GHL Help</span>
            </div>
            {/* Arrow pointing right to the avatar */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 rotate-45"
              style={{
                background: 'rgba(10,10,10,0.9)',
                borderRight: '1px solid rgba(208,2,27,0.25)',
                borderTop: '1px solid rgba(208,2,27,0.25)',
              }}
            />
          </div>
        )}

        {/* Avatar button */}
        {!isOpen && (
          <button
            onClick={handleOpen}
            className="group relative w-[72px] h-[72px] flex items-center justify-center focus:outline-none"
            aria-label="Open ARIA chatbot"
          >
            {/* Notification pulse ring - only on first load */}
            {showPulse && (
              <span
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{ border: '2px solid rgba(208,2,27,0.5)' }}
              />
            )}

            {/* Outer rotating ring */}
            <span
              className="absolute inset-0 rounded-full animate-spin-slow"
              style={{
                border: '1.5px solid transparent',
                borderTopColor: 'rgba(208,2,27,0.6)',
                borderRightColor: 'rgba(208,2,27,0.2)',
              }}
            />

            {/* Inner glowing avatar */}
            <span
              className="relative w-12 h-12 rounded-xl flex items-center justify-center animate-float text-white font-bold text-xl select-none"
              style={{
                background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                boxShadow: '0 0 24px rgba(208,2,27,0.5), 0 0 48px rgba(208,2,27,0.2)',
              }}
            >
              A
            </span>

            {/* Tooltip on hover */}
            <span
              className="absolute bottom-full mb-3 right-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: 'rgba(10,10,10,0.9)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Ask ARIA &mdash; Your GHL Guide
            </span>
          </button>
        )}
      </div>

      {/* ================================================================
          EXPANDED CHAT PANEL
          ================================================================ */}
      <div
        className={`fixed z-[9999] transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
        style={{
          bottom: '100px',
          right: '24px',
          width: '380px',
          height: '560px',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100vh - 140px)',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(208,2,27,0.25)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(208,2,27,0.1)',
        }}
        role="dialog"
        aria-label="ARIA AI Chatbot"
      >
        <div className="flex flex-col h-full">
          {/* ------ Header ------ */}
          <div className="flex items-center px-5 py-4 shrink-0">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Mini avatar */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                }}
              >
                A
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm">ARIA</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  Online &middot; Powered by GHL AI
                </p>
              </div>
            </div>

            {/* Minimize */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-1"
              aria-label="Minimize chat"
            >
              <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="14" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-1"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Red divider */}
          <div className="h-px shrink-0" style={{ background: 'rgba(208,2,27,0.3)' }} />

          {/* ------ Messages Area ------ */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{
              background: '#0A0A0A',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(208,2,27,0.4) transparent',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {msg.role === 'bot' ? (
                  /* --- ARIA message (left) --- */
                  <div className="flex items-start space-x-2.5 max-w-[88%]">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-white text-[11px] font-bold mt-0.5"
                      style={{
                        background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                      }}
                    >
                      A
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl rounded-tl-md text-[14px] leading-relaxed text-gray-200"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>
                ) : (
                  /* --- User message (right) --- */
                  <div className="max-w-[80%]">
                    <div
                      className="px-4 py-3 rounded-2xl rounded-tr-md text-[14px] leading-relaxed text-white"
                      style={{
                        background: 'rgba(208,2,27,0.15)',
                        border: '1px solid rgba(208,2,27,0.2)',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Quick reply chips */}
            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 pt-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    className="px-3.5 py-2 rounded-full text-[12px] font-medium text-gray-300 transition-all duration-200 hover:text-white hover:border-brand-red/60 hover:bg-white/5"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(208,2,27,0.3)',
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start space-x-2.5 animate-fade-in">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)',
                  }}
                >
                  A
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-tl-md"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex space-x-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ------ Input Area ------ */}
          <div className="shrink-0 px-4 pt-3 pb-2">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center space-x-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 rounded-full text-[14px] text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-1 focus:ring-brand-red/30"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                aria-label="Type your message"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  background: input.trim()
                    ? 'linear-gradient(135deg, #D0021B 0%, #8B0000 100%)'
                    : 'rgba(208,2,27,0.3)',
                  boxShadow: input.trim() ? '0 0 16px rgba(208,2,27,0.3)' : 'none',
                }}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Disclaimer */}
            <p className="text-[10px] text-gray-600 text-center mt-2 leading-tight px-2">
              ARIA provides information, not financial advice. For investment decisions, speak with our advisors.
            </p>
          </div>

          {/* ------ Footer ------ */}
          <div
            className="shrink-0 text-center py-2.5 text-[10px] text-gray-600 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="inline-flex items-center space-x-1.5">
              <span>Private &amp; Secure</span>
              <span className="text-gray-700">|</span>
              <span>Powered by GHL AI</span>
              <span className="text-gray-700">|</span>
              <span className="text-gray-500 hover:text-brand-red cursor-pointer transition-colors">Privacy Policy</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
