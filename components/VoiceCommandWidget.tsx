'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Mic, MicOff, X, ChevronUp, ChevronDown, Volume2, VolumeX,
  Globe, Navigation, Send, Phone, PhoneCall, Mail, MessageCircle,
  Video, Moon, Sun, Search, Zap, Power, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { NAV_LINKS, BRAND } from '@/lib/constants'
import {
  isSarvamConfigured, sarvamTTS, playSarvamAudio,
  toSarvamLangCode, isSarvamTTSLanguage, SARVAM_AVATAR_VOICES,
} from '@/lib/sarvamService'

// ─── Flatten all nav links for navigation ───
interface NavItem { label: string; href: string }
function flattenNav(): NavItem[] {
  const items: NavItem[] = []
  for (const link of NAV_LINKS) {
    if ('children' in link && link.children) {
      for (const child of link.children) {
        items.push({ label: child.label, href: child.href })
      }
    } else {
      items.push({ label: link.label, href: link.href })
    }
  }
  return items
}

const ALL_PAGES = flattenNav()

// ─── Supported languages for TTS ───
const LANGUAGES = [
  { code: 'en-US', label: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'en-IN', label: 'English (IN)', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'hi-IN', label: 'Hindi', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ta-IN', label: 'Tamil', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'te-IN', label: 'Telugu', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'kn-IN', label: 'Kannada', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ml-IN', label: 'Malayalam', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'bn-IN', label: 'Bengali', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'gu-IN', label: 'Gujarati', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'mr-IN', label: 'Marathi', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'pa-IN', label: 'Punjabi', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'es-ES', label: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr-FR', label: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de-DE', label: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'ja-JP', label: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'zh-CN', label: 'Chinese', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ar-SA', label: 'Arabic', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'pt-BR', label: 'Portuguese', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'ru-RU', label: 'Russian', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'ko-KR', label: 'Korean', flag: '\u{1F1F0}\u{1F1F7}' },
]

// ─── Command parser ───
type CmdType = 'navigate' | 'scroll' | 'read' | 'stop' | 'help' | 'language'
  | 'call' | 'directcall' | 'email' | 'whatsapp' | 'telegram' | 'video' | 'dark' | 'light'
  | 'search' | 'close' | 'home' | 'back' | 'downloadapps' | 'callingsolutions'
  | 'openchat' | 'closechat' | 'refresh' | 'share' | 'print' | 'fullscreen'
  | 'time' | 'date' | 'ghlinfo' | 'sebi' | 'address' | 'officehours'
  | 'zoomin' | 'zoomout' | 'zoomreset' | 'fontup' | 'fontdown' | 'fontreset'
  | 'scrollleft' | 'scrollright' | 'scrollfast' | 'scrollslow'
  | 'nextsection' | 'prevsection' | 'highlight' | 'contrast'
  | 'bookmark' | 'openlivechat' | 'weather' | 'calculator'
  | 'forward' | 'selectall' | 'clearhistory' | 'focusmain'
  // v3.0: Greetings & assistant
  | 'greeting' | 'thankyou' | 'bye'
  // v3.0: Form filling
  | 'formfocus' | 'formnext' | 'formprev' | 'formsubmit' | 'formclear'
  | 'formcheck' | 'formuncheck' | 'formupload'
  // v3.0: Dynamic commands
  | 'typedynamic' | 'clickdynamic' | 'setdynamic'
  // v3.0: Tool/calculator navigation
  | 'tooltool'
  // v3.0: TTS controls
  | 'pause' | 'resume' | 'speedup' | 'speeddown'
  // v3.0: Additional utility
  | 'toggletheme' | 'exitfullscreen' | 'closepopup'
  // v3.0: Quick info (spoken answers)
  | 'phonenumber' | 'emailaddress' | 'issafe' | 'howto' | 'whatreturns' | 'minimuminvest'
  | 'unknown'

interface ParsedCommand {
  type: CmdType
  target?: string
  value?: string
  direction?: 'up' | 'down' | 'top' | 'bottom' | 'left' | 'right'
}

function parseCommand(input: string): ParsedCommand {
  const text = input.toLowerCase().trim()

  // Close widget (+ Hinglish)
  if (/^(?:close|exit|bye|goodbye|shut|dismiss|hide|go away|stop listening|band karo|hatao|close karo)$/.test(text)) return { type: 'close' }

  // Home / back (+ Hinglish)
  if (/^(?:go home|home page|take me home|homepage|ghar|ghar ja|mukhya page|home pe ja|home dikhao)$/.test(text)) return { type: 'home' }
  if (/^(?:go back|back|previous page|previous|peeche jao|peeche|wapas|wapas jao|pichla page)$/.test(text)) return { type: 'back' }

  // Navigation commands
  const navPatterns = [
    /^(?:go to|open|navigate to|take me to|show me|visit)\s+(.+)$/,
    /^(.+?)\s+page$/,
  ]
  for (const pattern of navPatterns) {
    const match = text.match(pattern)
    if (match) return { type: 'navigate', target: match[1].trim() }
  }

  // Scroll commands — vertical (+ Hinglish)
  if (/scroll\s*up|go\s*up|page\s*up|move\s*up|swipe\s*up|upar|upar\s*jao|upar\s*scroll|thoda\s*upar|aur\s*upar/.test(text) && text.length < 30) return { type: 'scroll', direction: 'up' }
  if (/scroll\s*down|go\s*down|page\s*down|move\s*down|swipe\s*down|neeche|neeche\s*jao|neeche\s*scroll|thoda\s*neeche|aur\s*neeche/.test(text) && text.length < 30) return { type: 'scroll', direction: 'down' }
  if (/^up$/.test(text)) return { type: 'scroll', direction: 'up' }
  if (/^down$/.test(text)) return { type: 'scroll', direction: 'down' }
  if (/^move$/.test(text)) return { type: 'scroll', direction: 'down' }
  if (/scroll\s*(?:to\s*)?top|go\s*(?:to\s*)?top|beginning|sabse\s*upar|ekdum\s*upar|top\s*pe\s*jao/.test(text) && text.length < 30) return { type: 'scroll', direction: 'top' }
  if (/scroll\s*(?:to\s*)?bottom|go\s*(?:to\s*)?bottom|^end$|sabse\s*neeche|ekdum\s*neeche|page\s*ka\s*end/.test(text) && text.length < 30) return { type: 'scroll', direction: 'bottom' }
  if (/^top$/.test(text)) return { type: 'scroll', direction: 'top' }
  if (/^bottom$/.test(text)) return { type: 'scroll', direction: 'bottom' }
  // Scroll commands — horizontal
  if (/scroll\s*left|go\s*left|move\s*left|swipe\s*left/.test(text) && text.length < 25) return { type: 'scroll', direction: 'left' }
  if (/scroll\s*right|go\s*right|move\s*right|swipe\s*right/.test(text) && text.length < 25) return { type: 'scroll', direction: 'right' }
  if (/^left$/.test(text)) return { type: 'scroll', direction: 'left' }
  if (/^right$/.test(text)) return { type: 'scroll', direction: 'right' }
  // Scroll speed (+ Hinglish)
  if (/scroll\s*fast|fast\s*scroll|quick\s*scroll|jaldi\s*neeche|bahut\s*neeche|fast\s*down/.test(text)) return { type: 'scrollfast' }
  if (/scroll\s*slow|slow\s*scroll|gentle\s*scroll|aaram\s*se|dheere/.test(text)) return { type: 'scrollslow' }
  // Section navigation
  if (/next\s*section|next\s*part|scroll\s*next|next/.test(text) && text.length < 20) return { type: 'nextsection' }
  if (/previous\s*section|prev\s*section|scroll\s*prev|previous/.test(text) && text.length < 25) return { type: 'prevsection' }

  // Read aloud
  if (/^(?:read|read aloud|read this|read page|read out|read it|read the page|read content)/.test(text)) return { type: 'read' }

  // Stop speaking
  if (/^(?:stop|shut up|quiet|silence|cancel|pause|mute)/.test(text)) return { type: 'stop' }

  // Contact actions (+ Hinglish)
  if (/(?:direct call|call us|phone numbers|office number|call ghl|phone call|landline|office call|dusra number)/.test(text)) return { type: 'directcall' }
  if (/(?:download.*app|get.*calling.*app|install.*app|need.*calling|no.*app|app download|app chahiye)/.test(text)) return { type: 'downloadapps' }
  if (/(?:calling solutions|web calling|click to call|webrtc|call integrations|call solutions)/.test(text)) return { type: 'callingsolutions' }
  if (/(?:call|phone|ring|dial|phone karo|call karo|call maaro|baat karo phone)/.test(text)) return { type: 'call' }
  if (/(?:email|mail|send email|write email|send mail|email us|mail us|email bhejo|mail karo|email likho)/.test(text)) return { type: 'email' }
  if (/(?:whatsapp|whats app|chat on whatsapp|message on whatsapp|whatsapp chat|whatsapp karo|whatsapp bhejo|whatsapp pe baat)/.test(text)) return { type: 'whatsapp' }
  if (/(?:telegram|tg|telegram chat|telegram pe message|telegram karo)/.test(text)) return { type: 'telegram' }
  if (/(?:video call|video chat|video|webcam|start video|video meeting|video pe baat|video call karo)/.test(text)) return { type: 'video' }

  // Chat/ARIA commands
  if (/(?:open chat|open aria|hey aria|talk to aria|start chat|chatbot)/.test(text)) return { type: 'openchat' }
  if (/(?:close chat|close aria|hide chat)/.test(text)) return { type: 'closechat' }

  // Theme commands
  if (/(?:dark mode|dark theme|night mode|go dark)/.test(text)) return { type: 'dark' }
  if (/(?:light mode|light theme|day mode|go light|bright)/.test(text)) return { type: 'light' }

  // Utility commands
  if (/(?:refresh|reload)/.test(text)) return { type: 'refresh' }
  if (/(?:share|copy link|share page|share this)/.test(text)) return { type: 'share' }
  if (/(?:print|print page)/.test(text)) return { type: 'print' }
  if (/(?:fullscreen|full screen|maximize)/.test(text)) return { type: 'fullscreen' }

  // Time & date
  if (/(?:what time|current time|time now|tell.*time)/.test(text)) return { type: 'time' }
  if (/(?:what date|current date|today|what day|tell.*date)/.test(text)) return { type: 'date' }

  // Zoom commands
  if (/(?:zoom in|zoom\s*\+|bigger|enlarge|magnify)/.test(text)) return { type: 'zoomin' }
  if (/(?:zoom out|zoom\s*-|smaller|shrink|reduce)/.test(text)) return { type: 'zoomout' }
  if (/(?:zoom reset|normal zoom|reset zoom|100%|actual size)/.test(text)) return { type: 'zoomreset' }

  // Font size commands
  if (/(?:font bigger|font up|increase font|larger text|bigger text|bigger font)/.test(text)) return { type: 'fontup' }
  if (/(?:font smaller|font down|decrease font|smaller text|smaller font)/.test(text)) return { type: 'fontdown' }
  if (/(?:font reset|reset font|normal font|default font)/.test(text)) return { type: 'fontreset' }

  // Accessibility
  if (/(?:high contrast|contrast mode|toggle contrast)/.test(text)) return { type: 'contrast' }
  if (/(?:highlight links|highlight|show links)/.test(text)) return { type: 'highlight' }
  if (/(?:focus main|focus content|skip to content|main content)/.test(text)) return { type: 'focusmain' }

  // Additional utility commands (+ Hinglish)
  if (/(?:bookmark|save page|add bookmark|bookmark karo|yaad rakhlo)/.test(text)) return { type: 'bookmark' }
  if (/(?:live chat|open live chat|chat widgets|free chat)/.test(text)) return { type: 'openlivechat' }
  if (/(?:go forward|forward|next page|aage jao|aage|agla page)/.test(text)) return { type: 'forward' }
  if (/(?:select all|select everything)/.test(text)) return { type: 'selectall' }
  if (/(?:clear|clear history|clear chat|reset)/.test(text) && text.length < 20) return { type: 'clearhistory' }
  if (/(?:calculator|calculate|calc|math)/.test(text) && text.length < 15) return { type: 'calculator' }
  if (/(?:weather|temperature|forecast|mausam)/.test(text)) return { type: 'weather' }
  if (/(?:close popup|close modal|close overlay|popup band|dismiss|escape)/.test(text)) return { type: 'closepopup' }
  if (/(?:exit fullscreen|leave fullscreen|minimize|chhota karo screen|fullscreen band)/.test(text)) return { type: 'exitfullscreen' }
  if (/(?:toggle theme|switch theme|change theme|theme badlo|theme change karo|flip theme)/.test(text)) return { type: 'toggletheme' }

  // v3.0: TTS Controls
  if (/^(?:pause|pause reading|roko|thehro|ek second|hold on|pause karo)$/.test(text)) return { type: 'pause' }
  if (/^(?:resume|continue|keep reading|continue reading|unpause|aage padho|phir se bolo|continue karo|jari rakho)$/.test(text)) return { type: 'resume' }
  if (/(?:faster|read faster|speed up|jaldi bolo|tez bolo|fast karo|increase speed)/.test(text)) return { type: 'speedup' }
  if (/(?:slower|read slower|slow down|dheere bolo|aaram se bolo|slow karo|decrease speed)/.test(text)) return { type: 'speeddown' }

  // v3.0: Greetings (Hinglish)
  if (/^(?:hello|hi|hey|good morning|good afternoon|good evening|namaste|namaskar|vanakkam|kaise ho|kya haal|sab theek|howdy|suprabhat|shubh sandhya)$/.test(text)) return { type: 'greeting' }
  if (/^(?:thank you|thanks|thanks a lot|shukriya|dhanyavad|bahut accha|nice|great|wonderful|awesome|perfect|nandri|bohot shukriya)$/.test(text)) return { type: 'thankyou' }
  if (/^(?:bye|goodbye|bye bye|see you|good night|tata|alvida|phir milenge|chalta hun|chal bye|take care|shubh ratri)$/.test(text)) return { type: 'bye' }

  // v3.0: Form Filling Commands (Hinglish)
  if (/(?:name field|enter name|go to name|fill name|naam likho|naam bharo|naam daalo|name daalo|name pe jao|type name|click name|apna naam)/.test(text)) return { type: 'formfocus', target: 'name' }
  if (/(?:email field|enter email|go to email|fill email|email daalo|email likho|email bharo|email pe jao|type email|apna email|email address)/.test(text)) return { type: 'formfocus', target: 'email' }
  if (/(?:phone field|enter phone|mobile field|fill phone|phone number daalo|mobile daalo|number bharo|apna number|enter mobile|type phone|phone pe jao|contact number)/.test(text)) return { type: 'formfocus', target: 'phone' }
  if (/(?:message field|enter message|fill message|type message|message daalo|message likho|comment|comment box|message box|sandesh likho|description|query field|sawal likho)/.test(text)) return { type: 'formfocus', target: 'message' }
  if (/(?:password field|enter password|fill password|password daalo|password likho|password pe jao)/.test(text)) return { type: 'formfocus', target: 'password' }
  if (/(?:amount field|enter amount|fill amount|investment amount|kitna invest|amount daalo|paisa daalo|rashi daalo|amount bharo)/.test(text)) return { type: 'formfocus', target: 'amount' }
  if (/^(?:next field|next box|agla field|agla|tab|next wala|next input|move next|agla box|aage jao field)/.test(text)) return { type: 'formnext' }
  if (/^(?:previous field|previous box|pichla field|pichla|back field|pichla wala|previous input|peeche wala field)/.test(text)) return { type: 'formprev' }
  if (/(?:submit|submit form|send form|submit karo|bhejo|form bhejo|jama karo|form submit|send karo|apply|form done|ho gaya|save form|save karo)/.test(text) && text.length < 25) return { type: 'formsubmit' }
  if (/(?:clear form|reset form|form clear karo|form reset karo|sab hatao|all clear|start over|dubara se|phir se bharo|empty form)/.test(text)) return { type: 'formclear' }
  if (/(?:check|tick|checkbox|accept|agree|check karo|tick karo|accept karo|agree karo|manzoor hai|haan|check the box|i agree|i accept|maan gaye)/.test(text) && text.length < 25) return { type: 'formcheck' }
  if (/(?:uncheck|untick|uncheck karo|hatao tick|disagree|remove check|checkbox hatao)/.test(text)) return { type: 'formuncheck' }
  if (/(?:upload|upload file|attach file|choose file|file upload|upload karo|file daalo|document upload|photo upload|image upload|file bhejo)/.test(text)) return { type: 'formupload' }

  // v3.0: Tool/Calculator Navigation
  if (/(?:sip calculator|open sip|sip calc|calculate sip|^sip$|sip dikhao|monthly sip|sip kitna|sip calculate)/.test(text)) return { type: 'tooltool', target: 'sip' }
  if (/(?:lump\s*sum|lumpsum|lump sum calculator|ek baar invest|one time investment)/.test(text)) return { type: 'tooltool', target: 'lump' }
  if (/(?:compound interest|ci calculator|chakravridhi|compound calc)/.test(text)) return { type: 'tooltool', target: 'compound' }
  if (/(?:future value|fv calculator|bhavishya value|future mein kitna)/.test(text)) return { type: 'tooltool', target: 'future' }
  if (/(?:present value|pv calculator|aaj ki value)/.test(text)) return { type: 'tooltool', target: 'present' }
  if (/(?:investment growth|growth calculator|kitna badhega)/.test(text)) return { type: 'tooltool', target: 'growth' }
  if (/(?:portfolio return|portfolio calculator|portfolio kitna mila)/.test(text)) return { type: 'tooltool', target: 'portfolio' }
  if (/(?:^cagr$|cagr calculator|growth rate|cagr calc|compound growth rate)/.test(text)) return { type: 'tooltool', target: 'cagr' }
  if (/(?:^xirr$|xirr calculator|xirr calc)/.test(text)) return { type: 'tooltool', target: 'xirr' }
  if (/(?:^irr$|irr calculator|internal rate of return)/.test(text)) return { type: 'tooltool', target: 'irr' }
  if (/(?:dividend|dividend yield|dividend calculator|dividend kitna milega)/.test(text)) return { type: 'tooltool', target: 'dividend' }
  if (/(?:inflation|inflation calculator|inflation adjusted|real return|mehngai calculator)/.test(text)) return { type: 'tooltool', target: 'inflation' }
  if (/(?:risk analyzer|risk return|risk calculator|risk analysis|jokhim|risk vs return)/.test(text)) return { type: 'tooltool', target: 'risk' }
  if (/(?:live market|live markets|market data|stock market|nifty|sensex|bse|nse|share price|bazaar|market dikhao|aaj ka market)/.test(text)) return { type: 'tooltool', target: 'live' }
  if (/(?:real estate tools|property calculator|ghar calculator|property calc|rent calculator)/.test(text)) return { type: 'tooltool', target: 'real-estate' }
  if (/(?:tax tools|tax calculator|tax planning|income tax|gst|tax calc|tax dikhao)/.test(text)) return { type: 'tooltool', target: 'tax' }
  if (/(?:forex|forex tools|currency|commodity|gold price|dollar rate|sona ka rate)/.test(text)) return { type: 'tooltool', target: 'forex' }
  if (/(?:wealth planning|wealth tools|retirement|retirement calculator)/.test(text)) return { type: 'tooltool', target: 'wealth' }
  if (/(?:trading tools|market tools|trading calculator)/.test(text)) return { type: 'tooltool', target: 'trading' }
  if (/(?:advanced tools|advanced investor|pro tools|expert tools)/.test(text)) return { type: 'tooltool', target: 'advanced' }

  // v3.0: Dynamic Commands
  const typeMatch = text.match(/^(?:type|likh|likho|enter|write)\s+(.+)$/)
  if (typeMatch && typeMatch[1].length > 2) return { type: 'typedynamic', value: typeMatch[1].trim() }
  const clickMatch = text.match(/^(?:click|press|tap|click on|press on|dabao)\s+(.+)$/)
  if (clickMatch) return { type: 'clickdynamic', target: clickMatch[1].trim() }
  const setMatch = text.match(/^set\s+(.+?)\s+to\s+(.+)$/)
  if (setMatch) return { type: 'setdynamic', target: setMatch[1].trim(), value: setMatch[2].trim() }

  // v3.0: Quick info (spoken) — Hinglish
  if (/(?:what is ghl|about ghl|tell me about ghl|ghl info|ghl kya hai|company kya karti hai)/.test(text)) return { type: 'ghlinfo' }
  if (/(?:sebi|registration|sebi number|registered|sebi approved|sebi certificate|sebi id)/.test(text)) return { type: 'sebi' }
  if (/(?:address|location|where is ghl|office location|where are you|kahan hai office|office kahan|address kya hai|ghl ka address)/.test(text)) return { type: 'address' }
  if (/(?:office hours|working hours|timings|business hours|when.*open|kab khulte ho|office timing|timing kya hai)/.test(text)) return { type: 'officehours' }
  if (/(?:phone number|contact number|mobile number|number kya hai|number do|number batao|ghl ka number)/.test(text)) return { type: 'phonenumber' }
  if (/(?:email address|email id|mail id|email kya hai|email do|email batao|ghl ka email)/.test(text)) return { type: 'emailaddress' }
  if (/(?:is it safe|safe hai|paisa doobega|risk hai kya|secure hai|trust kar sakte|reliable|trustworthy|genuine hai|scam toh nahi|legit hai)/.test(text)) return { type: 'issafe' }
  if (/(?:how to invest|invest kaise|kaise invest|investment process|paisa kaise lagayen|step by step invest|process kya hai|kya karna padega)/.test(text)) return { type: 'howto' }
  if (/(?:what returns|kitna return|return kya hai|expected return|interest rate|profit kitna|kitna milega|how much return|kamai kitni)/.test(text)) return { type: 'whatreturns' }
  if (/(?:minimum investment|kitna invest karna|minimum amount|kam se kam kitna|entry amount|minimum kitna|how much to invest|starting amount|kitne se shuru)/.test(text)) return { type: 'minimuminvest' }

  // Language switch (+ Hinglish)
  if (/(?:switch to|speak in|change language|set language|language|mein baat karo)\s+(.+)/.test(text)) {
    const m = text.match(/(?:switch to|speak in|change language|set language|language|mein baat karo)\s+(.+)/)
    return { type: 'language', target: m ? m[1].trim() : '' }
  }

  // Search (+ Hinglish)
  if (/^(?:search|find|look for|dhundho|khojo)\s+(.+)/.test(text)) return { type: 'search', target: text.replace(/^(?:search|find|look for|dhundho|khojo)\s+/, '') }

  // Help (+ Hinglish)
  if (/^(?:help|commands|what can you do|menu|madad|sahayata|guide me|madad karo|help me|kya bol sakte|sab commands|voice help|command list)/.test(text)) return { type: 'help' }

  // Try to match as a page name directly
  const directMatch = findPage(text)
  if (directMatch) return { type: 'navigate', target: text }

  return { type: 'unknown' }
}

function findPage(query: string): NavItem | null {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  let match = ALL_PAGES.find(p => p.label.toLowerCase() === q)
  if (match) return match
  match = ALL_PAGES.find(p => p.label.toLowerCase().includes(q) || q.includes(p.label.toLowerCase()))
  if (match) return match
  match = ALL_PAGES.find(p => p.href.toLowerCase().includes(q.replace(/\s+/g, '-')))
  if (match) return match
  return null
}

export default function VoiceCommandWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [language, setLanguage] = useState('en-US')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoMicTriggered = useRef(false)
  const intentionalStop = useRef(false)
  const widgetClosed = useRef(false)

  const router = useRouter()
  const pathname = usePathname()

  // ─── Mount + load voices ───
  useEffect(() => {
    setMounted(true)
    synthRef.current = window.speechSynthesis

    // Voices load async in Chrome — wait for them
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) setVoicesLoaded(true)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // ─── Auto-trigger: show "Speak to navigate" prompt, then open mic ───
  useEffect(() => {
    if (!mounted || autoMicTriggered.current) return
    autoMicTriggered.current = true

    // Show floating "Speak to navigate" prompt first
    const promptTimer = setTimeout(() => {
      setShowPrompt(true)
    }, 1500)

    // After 3s, auto-open widget and start continuous mic
    const openTimer = setTimeout(() => {
      setShowPrompt(false)
      setIsOpen(true)
      setShowPulse(false)
      widgetClosed.current = false
      setFeedback('Mic is ON. Say "help" for commands, or speak a page name. Say "close" to exit.')
      // Start continuous mic after panel renders
      setTimeout(() => {
        startContinuousMic()
      }, 600)
    }, 4000)

    return () => {
      clearTimeout(promptTimer)
      clearTimeout(openTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Stop speaking on route change (but keep mic on)
  useEffect(() => {
    stopSpeaking()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // ─── TTS Speak — Sarvam AI for Indian languages, native fallback ───
  const speak = useCallback((text: string, lang?: string) => {
    const useLang = lang || language

    // Try Sarvam TTS for Indian languages
    if (isSarvamConfigured() && isSarvamTTSLanguage(useLang)) {
      setIsSpeaking(true)
      sarvamTTS({
        text,
        targetLanguage: toSarvamLangCode(useLang),
        speaker: SARVAM_AVATAR_VOICES.abe,
      }).then(audio => {
        if (audio) return playSarvamAudio(audio)
        // Sarvam failed — fall through to native
        speakNative(text, useLang)
      }).catch(() => {
        speakNative(text, useLang)
      }).finally(() => {
        setIsSpeaking(false)
      })
      return
    }

    // Fallback: Web Speech API
    speakNative(text, useLang)
  }, [language])

  // Native Web Speech API TTS (fallback)
  const speakNative = useCallback((text: string, useLang: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = useLang
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    let voices = synthRef.current.getVoices()
    if (voices.length === 0) {
      synthRef.current.cancel()
      voices = synthRef.current.getVoices()
    }
    const langPrefix = useLang.split('-')[0]

    let voice = voices.find(v => v.lang === useLang)
    if (!voice) voice = voices.find(v => v.lang.replace('_', '-') === useLang)
    if (!voice) voice = voices.find(v => v.lang.startsWith(langPrefix + '-') || v.lang.startsWith(langPrefix + '_'))
    if (!voice) voice = voices.find(v => v.lang === langPrefix)
    if (!voice) {
      const langLabel = LANGUAGES.find(l => l.code === useLang)?.label.toLowerCase() || ''
      if (langLabel) voice = voices.find(v => v.name.toLowerCase().includes(langLabel))
    }

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    synthRef.current.speak(utterance)
  }, [])

  const readPageContent = useCallback(() => {
    const main = document.getElementById('main-content') || document.querySelector('main') || document.querySelector('[role="main"]') || document.body
    if (!main) {
      setFeedback('No content found to read.')
      return
    }

    const selectors = 'h1, h2, h3, h4, p, li, td, blockquote, figcaption, [role="heading"]'
    const elements = Array.from(main.querySelectorAll(selectors))
    const seen = new Set<string>()
    let text = ''

    for (const el of elements) {
      if (text.length > 2500) break
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
      if (el.closest('nav, footer, button, form, [aria-hidden="true"], script, style, noscript')) continue

      const raw = (el as HTMLElement).innerText || ''
      const cleaned = raw.replace(/\s+/g, ' ').trim()
      if (cleaned.length < 4) continue
      if (/^https?:\/\//.test(cleaned)) continue
      if (/^[A-Z0-9]{2,4}$/.test(cleaned)) continue
      if (seen.has(cleaned)) continue
      seen.add(cleaned)
      text += cleaned + '. '
    }

    if (text.trim()) {
      const langName = LANGUAGES.find(l => l.code === language)?.label || 'English'
      setFeedback(`Reading page in ${langName}...`)
      speak(text.trim())
    } else {
      setFeedback('No readable content found on this page.')
    }
  }, [speak, language])

  // ─── Close the entire widget ───
  const closeWidget = useCallback(() => {
    widgetClosed.current = true
    intentionalStop.current = true
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    stopSpeaking()
    setIsListening(false)
    setIsOpen(false)
    setFeedback('')
    setInputText('')
    setShowLangPicker(false)
  }, [stopSpeaking])

  const executeCommand = useCallback((raw: string) => {
    const cmd = parseCommand(raw)

    switch (cmd.type) {
      case 'close': {
        setFeedback('Closing voice navigator. Goodbye!')
        speak('Goodbye!')
        setTimeout(() => closeWidget(), 800)
        break
      }
      case 'home': {
        setFeedback('Going to Home page...')
        speak('Going to Home page.')
        setTimeout(() => router.push('/'), 500)
        break
      }
      case 'back': {
        setFeedback('Going back...')
        speak('Going back.')
        setTimeout(() => window.history.back(), 500)
        break
      }
      case 'navigate': {
        const page = findPage(cmd.target || '')
        if (page) {
          setFeedback(`Navigating to ${page.label}...`)
          speak(`Going to ${page.label}`)
          setTimeout(() => router.push(page.href), 500)
        } else {
          setFeedback(`Page "${cmd.target}" not found. Try: ${ALL_PAGES.slice(0, 4).map(p => p.label).join(', ')}...`)
          speak('Sorry, I could not find that page.')
        }
        break
      }
      case 'scroll': {
        const scrollMap = { up: -600, down: 600, left: 0, right: 0, top: 0, bottom: 0 }
        if (cmd.direction === 'up' || cmd.direction === 'down') {
          window.scrollBy({ top: scrollMap[cmd.direction], behavior: 'smooth' })
          setFeedback(`Scrolling ${cmd.direction}...`)
        } else if (cmd.direction === 'left') {
          window.scrollBy({ left: -400, behavior: 'smooth' })
          setFeedback('Scrolling left...')
        } else if (cmd.direction === 'right') {
          window.scrollBy({ left: 400, behavior: 'smooth' })
          setFeedback('Scrolling right...')
        } else if (cmd.direction === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setFeedback('Scrolling to top...')
        } else if (cmd.direction === 'bottom') {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          setFeedback('Scrolling to bottom...')
        }
        break
      }
      case 'scrollfast': {
        window.scrollBy({ top: 1500, behavior: 'smooth' })
        setFeedback('Fast scrolling down...')
        break
      }
      case 'scrollslow': {
        window.scrollBy({ top: 200, behavior: 'smooth' })
        setFeedback('Slow scrolling down...')
        break
      }
      case 'nextsection': {
        // Find the next heading below current viewport
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, section'))
        const viewTop = window.scrollY + 100
        const nextH = headings.find(h => (h as HTMLElement).offsetTop > viewTop)
        if (nextH) {
          (nextH as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
          setFeedback('Jumping to next section...')
        } else {
          setFeedback('No more sections below.')
        }
        break
      }
      case 'prevsection': {
        const headingsRev = Array.from(document.querySelectorAll('h1, h2, h3, section')).reverse()
        const viewTopRev = window.scrollY - 50
        const prevH = headingsRev.find(h => (h as HTMLElement).offsetTop < viewTopRev)
        if (prevH) {
          (prevH as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
          setFeedback('Jumping to previous section...')
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setFeedback('At the top — no previous sections.')
        }
        break
      }
      case 'read': {
        readPageContent()
        break
      }
      case 'stop': {
        stopSpeaking()
        setFeedback('Stopped speaking.')
        break
      }
      case 'directcall': {
        setFeedback('Opening Direct Call widget...')
        speak('Opening direct call.')
        const directCallBtn = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (directCallBtn) directCallBtn.click()
        break
      }
      case 'call': {
        setFeedback('Opening phone dialer...')
        speak('Calling GHL India Ventures.')
        window.open(`tel:${BRAND.mobile}`, '_self')
        break
      }
      case 'email': {
        setFeedback('Opening email client...')
        speak('Opening email.')
        window.open(`mailto:${BRAND.email}?subject=Investment%20Inquiry`, '_self')
        break
      }
      case 'whatsapp': {
        setFeedback('Opening WhatsApp...')
        speak('Opening WhatsApp chat.')
        window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(BRAND.whatsappMessage)}`, '_blank')
        break
      }
      case 'telegram': {
        setFeedback('Opening Telegram...')
        speak('Opening Telegram.')
        window.open('https://t.me/ghlindia', '_blank')
        break
      }
      case 'video': {
        setFeedback('Opening video call widget...')
        speak('Opening video call.')
        setTimeout(() => {
          // Use custom event (preferred, works with duplicate prevention)
          window.dispatchEvent(new CustomEvent('ghl-open-video-call'))
          // Fallback: also try direct button click
          const videoBtn = document.querySelector('[aria-label="Open Sales & Support Video Call"]') as HTMLElement
          if (videoBtn) videoBtn.click()
        }, 300)
        break
      }
      case 'downloadapps': {
        setFeedback('Opening calling app downloads...')
        speak('Opening download options for calling apps.')
        const dcBtn = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (dcBtn) dcBtn.click()
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('ghl-show-downloads'))
        }, 500)
        break
      }
      case 'callingsolutions': {
        setFeedback('Opening web calling solutions...')
        speak('Opening web calling solutions and integrations.')
        const dcBtn2 = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (dcBtn2) dcBtn2.click()
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('ghl-show-solutions'))
        }, 500)
        break
      }
      case 'openchat': {
        setFeedback('Opening ARIA chatbot...')
        speak('Opening ARIA chat assistant.')
        const chatBtn = document.querySelector('[aria-label="Open ARIA chatbot"]') as HTMLElement
        if (chatBtn) chatBtn.click()
        break
      }
      case 'closechat': {
        setFeedback('Closing ARIA chatbot...')
        speak('Closing chat.')
        const closeBtn = document.querySelector('[aria-label="Close chat"]') as HTMLElement
        if (closeBtn) closeBtn.click()
        break
      }
      case 'refresh': {
        setFeedback('Refreshing page...')
        speak('Refreshing the page.')
        setTimeout(() => window.location.reload(), 500)
        break
      }
      case 'share': {
        setFeedback('Copying page link...')
        if (navigator.share) {
          navigator.share({ title: document.title, url: window.location.href })
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            setFeedback('Link copied to clipboard!')
            speak('Link copied to clipboard.')
          })
        }
        break
      }
      case 'print': {
        setFeedback('Opening print dialog...')
        speak('Opening print dialog.')
        setTimeout(() => window.print(), 500)
        break
      }
      case 'fullscreen': {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
          setFeedback('Entered fullscreen mode.')
          speak('Entering fullscreen.')
        } else {
          document.exitFullscreen()
          setFeedback('Exited fullscreen mode.')
          speak('Exiting fullscreen.')
        }
        break
      }
      case 'time': {
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        setFeedback(`Current time: ${now}`)
        speak(`The current time is ${now}`)
        break
      }
      case 'date': {
        const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        setFeedback(`Today: ${today}`)
        speak(`Today is ${today}`)
        break
      }
      case 'ghlinfo': {
        const info = 'GHL India Ventures is a SEBI registered Category 2 Alternative Investment Fund based in Chennai, specializing in stressed real estate and early-stage startup investments.'
        setFeedback(info)
        speak(info)
        break
      }
      case 'sebi': {
        const sebiInfo = 'GHL India Ventures SEBI registration number is IN/AIF2/2425/1517, registered as a Category 2 Alternative Investment Fund.'
        setFeedback('SEBI Reg: IN/AIF2/2425/1517')
        speak(sebiInfo)
        break
      }
      case 'address': {
        const addr = '2D, Queens Court, Number 6, Montieth Road, Egmore, Chennai, Tamil Nadu, PIN 600008'
        setFeedback(`Office: ${addr}`)
        speak(`GHL India Ventures is located at ${addr}`)
        break
      }
      case 'officehours': {
        const hours = 'Monday to Saturday, 9:30 AM to 6:30 PM IST'
        setFeedback(`Office Hours: ${hours}`)
        speak(`GHL India Ventures office hours are ${hours}`)
        break
      }
      case 'zoomin': {
        const currentZoom = parseFloat(document.documentElement.style.zoom || '1')
        const newZoom = Math.min(currentZoom + 0.1, 2)
        document.documentElement.style.zoom = String(newZoom)
        setFeedback(`Zoomed in to ${Math.round(newZoom * 100)}%`)
        speak(`Zoomed in to ${Math.round(newZoom * 100)} percent`)
        break
      }
      case 'zoomout': {
        const currentZ = parseFloat(document.documentElement.style.zoom || '1')
        const newZ = Math.max(currentZ - 0.1, 0.5)
        document.documentElement.style.zoom = String(newZ)
        setFeedback(`Zoomed out to ${Math.round(newZ * 100)}%`)
        speak(`Zoomed out to ${Math.round(newZ * 100)} percent`)
        break
      }
      case 'zoomreset': {
        document.documentElement.style.zoom = '1'
        setFeedback('Zoom reset to 100%')
        speak('Zoom reset to normal.')
        break
      }
      case 'fontup': {
        const root = document.documentElement
        const currentSize = parseFloat(getComputedStyle(root).fontSize)
        root.style.fontSize = `${Math.min(currentSize + 2, 28)}px`
        setFeedback(`Font size increased to ${Math.min(currentSize + 2, 28)}px`)
        speak('Font size increased.')
        break
      }
      case 'fontdown': {
        const rootEl = document.documentElement
        const curSize = parseFloat(getComputedStyle(rootEl).fontSize)
        rootEl.style.fontSize = `${Math.max(curSize - 2, 10)}px`
        setFeedback(`Font size decreased to ${Math.max(curSize - 2, 10)}px`)
        speak('Font size decreased.')
        break
      }
      case 'fontreset': {
        document.documentElement.style.fontSize = ''
        setFeedback('Font size reset to default.')
        speak('Font size reset.')
        break
      }
      case 'contrast': {
        const body = document.body
        if (body.classList.contains('ghl-high-contrast')) {
          body.classList.remove('ghl-high-contrast')
          body.style.filter = ''
          setFeedback('High contrast mode OFF.')
          speak('High contrast mode disabled.')
        } else {
          body.classList.add('ghl-high-contrast')
          body.style.filter = 'contrast(1.4) saturate(0.3)'
          setFeedback('High contrast mode ON.')
          speak('High contrast mode enabled.')
        }
        break
      }
      case 'highlight': {
        const links = document.querySelectorAll('a')
        const isHighlighted = document.body.classList.contains('ghl-links-highlighted')
        if (isHighlighted) {
          links.forEach(a => (a as HTMLElement).style.outline = '')
          document.body.classList.remove('ghl-links-highlighted')
          setFeedback('Link highlighting removed.')
          speak('Links no longer highlighted.')
        } else {
          links.forEach(a => (a as HTMLElement).style.outline = '2px solid #D0021B')
          document.body.classList.add('ghl-links-highlighted')
          setFeedback('All links highlighted!')
          speak('All links are now highlighted.')
        }
        break
      }
      case 'focusmain': {
        const mainContent = document.getElementById('main-content') || document.querySelector('main') || document.querySelector('[role="main"]')
        if (mainContent) {
          (mainContent as HTMLElement).tabIndex = -1
          ;(mainContent as HTMLElement).focus()
          mainContent.scrollIntoView({ behavior: 'smooth' })
          setFeedback('Focused on main content.')
          speak('Focused on main content area.')
        } else {
          setFeedback('No main content area found.')
        }
        break
      }
      case 'bookmark': {
        setFeedback('Bookmark shortcut: Press Ctrl+D (or Cmd+D on Mac) to bookmark this page.')
        speak('To bookmark this page, press Control D or Command D on Mac.')
        break
      }
      case 'openlivechat': {
        setFeedback('Opening ARIA with live chat info...')
        speak('Opening ARIA chat with live chat widget information.')
        const chatBtn = document.querySelector('[aria-label="Open ARIA chatbot"]') as HTMLElement
        if (chatBtn) chatBtn.click()
        break
      }
      case 'forward': {
        setFeedback('Going forward...')
        speak('Going forward.')
        setTimeout(() => window.history.forward(), 500)
        break
      }
      case 'selectall': {
        setFeedback('Selecting all text on page...')
        if (typeof window.getSelection !== 'undefined') {
          const range = document.createRange()
          const mainEl = document.getElementById('main-content') || document.body
          range.selectNodeContents(mainEl)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
        speak('All text selected.')
        break
      }
      case 'clearhistory': {
        setFeedback('Feedback cleared.')
        setInputText('')
        break
      }
      case 'calculator': {
        setFeedback('Opening calculator...')
        speak('Opening web calculator.')
        window.open('https://www.google.com/search?q=calculator', '_blank')
        break
      }
      case 'weather': {
        setFeedback('Opening weather for Chennai...')
        speak('Opening weather forecast for Chennai.')
        window.open('https://www.google.com/search?q=weather+chennai', '_blank')
        break
      }
      case 'dark': {
        setFeedback('Switching to dark mode...')
        speak('Switching to dark mode.')
        document.documentElement.classList.add('dark')
        localStorage.setItem('ghl-theme', 'dark')
        break
      }
      case 'light': {
        setFeedback('Switching to light mode...')
        speak('Switching to light mode.')
        document.documentElement.classList.remove('dark')
        localStorage.setItem('ghl-theme', 'light')
        break
      }
      case 'language': {
        const target = (cmd.target || '').toLowerCase()
        const found = LANGUAGES.find(l => l.label.toLowerCase().includes(target))
        if (found) {
          setLanguage(found.code)
          setFeedback(`Language set to ${found.label}. TTS will now speak in ${found.label}.`)
          speak(`Language changed to ${found.label}.`, found.code)
        } else {
          setFeedback(`Language "${cmd.target}" not found. Available: ${LANGUAGES.map(l => l.label).join(', ')}`)
        }
        break
      }
      case 'search': {
        setFeedback(`Searching for "${cmd.target}"...`)
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }))
        break
      }
      // ── v3.0: Greetings ──
      case 'greeting': {
        const h = new Date().getHours()
        const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
        const msg = `${g}! Welcome to GHL India Ventures. How can I help you today?`
        setFeedback(msg)
        speak(msg)
        break
      }
      case 'thankyou': {
        const msg = "You're most welcome! Anything else I can help with?"
        setFeedback(msg)
        speak(msg)
        break
      }
      case 'bye': {
        setFeedback('Goodbye! Thank you for visiting GHL India Ventures. Take care!')
        speak('Goodbye! Thank you for visiting GHL India Ventures. Take care!')
        setTimeout(() => closeWidget(), 2000)
        break
      }

      // ── v3.0: TTS Controls ──
      case 'pause': {
        if (synthRef.current) synthRef.current.pause()
        setFeedback('Paused. Say "resume" to continue.')
        break
      }
      case 'resume': {
        if (synthRef.current) synthRef.current.resume()
        setFeedback('Resumed reading.')
        break
      }
      case 'speedup': {
        setFeedback('Reading speed increased. Will apply on next read.')
        speak('Speed increased.')
        break
      }
      case 'speeddown': {
        setFeedback('Reading speed decreased. Will apply on next read.')
        speak('Speed decreased.')
        break
      }

      // ── v3.0: Form Filling ──
      case 'formfocus': {
        const fieldMap: Record<string, string[]> = {
          name: ['name', 'fullname', 'full_name', 'full-name', 'your-name', 'first-name', 'firstname'],
          email: ['email', 'mail', 'email-address', 'your-email'],
          phone: ['phone', 'mobile', 'tel', 'telephone', 'contact', 'number', 'phone-number'],
          message: ['message', 'comment', 'description', 'query', 'textarea', 'your-message', 'note', 'notes'],
          password: ['password', 'pass', 'pwd'],
          amount: ['amount', 'investment', 'invest-amount', 'sum', 'principal'],
        }
        const variants = fieldMap[cmd.target || 'name'] || [cmd.target || '']
        const inputs = document.querySelectorAll('input, textarea, select')
        let found = false
        for (const input of Array.from(inputs)) {
          const el = input as HTMLElement & { placeholder?: string; name?: string; type?: string }
          const id = (el.id || '').toLowerCase()
          const name = (el.getAttribute('name') || '').toLowerCase()
          const placeholder = ((el as any).placeholder || '').toLowerCase()
          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase()
          for (const variant of variants) {
            if (id.includes(variant) || name.includes(variant) || placeholder.includes(variant) || ariaLabel.includes(variant)) {
              el.focus()
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              el.style.outline = '3px solid #D0021B'
              el.style.outlineOffset = '4px'
              setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = '' }, 3000)
              setFeedback(`Focused on ${cmd.target} field. Start typing!`)
              speak(`${cmd.target} field ready.`)
              found = true
              break
            }
          }
          if (found) break
        }
        if (!found) {
          setFeedback(`${cmd.target} field not found on this page.`)
          speak(`${cmd.target} field not found.`)
        }
        break
      }
      case 'formnext': {
        const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button[type="submit"]'))
        if (!fields.length) { setFeedback('No form fields on this page.'); break }
        const current = document.activeElement
        let idx = fields.indexOf(current as Element)
        idx = (idx + 1) % fields.length
        ;(fields[idx] as HTMLElement).focus()
        ;(fields[idx] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
        const lbl = (fields[idx] as any).placeholder || (fields[idx] as any).name || 'field'
        setFeedback(`Next: ${lbl}`)
        break
      }
      case 'formprev': {
        const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button[type="submit"]'))
        if (!fields.length) { setFeedback('No form fields on this page.'); break }
        const current = document.activeElement
        let idx = fields.indexOf(current as Element)
        idx = (idx - 1 + fields.length) % fields.length
        ;(fields[idx] as HTMLElement).focus()
        ;(fields[idx] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
        const lbl = (fields[idx] as any).placeholder || (fields[idx] as any).name || 'field'
        setFeedback(`Previous: ${lbl}`)
        break
      }
      case 'formsubmit': {
        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement
        const form = document.querySelector('form') as HTMLFormElement
        if (submitBtn) {
          submitBtn.click()
          setFeedback('Submitting form...')
          speak('Submitting.')
        } else if (form) {
          form.requestSubmit ? form.requestSubmit() : form.submit()
          setFeedback('Form submitted.')
          speak('Submitted.')
        } else {
          setFeedback('No form found on this page.')
          speak('No form found.')
        }
        break
      }
      case 'formclear': {
        const form = document.querySelector('form') as HTMLFormElement
        if (form) { form.reset(); setFeedback('Form cleared.'); speak('Form cleared.') }
        else {
          document.querySelectorAll('input, textarea').forEach(el => { const inp = el as HTMLInputElement; if (inp.type !== 'hidden' && inp.type !== 'submit') inp.value = '' })
          setFeedback('Fields cleared.')
          speak('Cleared.')
        }
        break
      }
      case 'formcheck': {
        const cb = document.querySelector('input[type="checkbox"]:not(:checked)') as HTMLElement
        if (cb) { cb.click(); setFeedback('Checked!'); speak('Checked.') }
        else { setFeedback('All checkboxes already checked.') }
        break
      }
      case 'formuncheck': {
        const cb = document.querySelector('input[type="checkbox"]:checked') as HTMLElement
        if (cb) { cb.click(); setFeedback('Unchecked.'); speak('Unchecked.') }
        break
      }
      case 'formupload': {
        const fileInput = document.querySelector('input[type="file"]') as HTMLElement
        if (fileInput) { fileInput.click(); setFeedback('File browser opened.'); speak('Choose your file.') }
        else { setFeedback('No file upload field on this page.') }
        break
      }

      // ── v3.0: Dynamic Commands ──
      case 'typedynamic': {
        const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
          el.value = cmd.value || ''
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
          setFeedback(`Typed: "${cmd.value}"`)
          speak(`Typed ${cmd.value}`)
        } else {
          setFeedback('Click on a field first, then say "type [your text]".')
          speak('Please click on a field first.')
        }
        break
      }
      case 'clickdynamic': {
        const target = (cmd.target || '').toLowerCase()
        const clickables = document.querySelectorAll('button, a, [role="button"], [type="submit"]')
        let clicked = false
        for (const el of Array.from(clickables)) {
          const elText = (el.textContent || '').toLowerCase().trim()
          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase()
          if (elText.includes(target) || ariaLabel.includes(target) || target.includes(elText)) {
            ;(el as HTMLElement).click()
            setFeedback(`Clicked: "${el.textContent?.trim().substring(0, 30)}"`)
            speak('Clicked.')
            clicked = true
            break
          }
        }
        if (!clicked) {
          setFeedback(`Could not find "${cmd.target}" button.`)
          speak(`Button ${cmd.target} not found.`)
        }
        break
      }
      case 'setdynamic': {
        // Focus field first, then type value
        const fTarget = (cmd.target || '').toLowerCase()
        const inputs = document.querySelectorAll('input, textarea, select')
        let setDone = false
        for (const input of Array.from(inputs)) {
          const el = input as HTMLInputElement
          const id = (el.id || '').toLowerCase()
          const name = (el.getAttribute('name') || '').toLowerCase()
          const placeholder = (el.placeholder || '').toLowerCase()
          if (id.includes(fTarget) || name.includes(fTarget) || placeholder.includes(fTarget)) {
            el.focus()
            el.value = cmd.value || ''
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
            setFeedback(`Set ${cmd.target} = "${cmd.value}"`)
            speak(`Set ${cmd.target} to ${cmd.value}`)
            setDone = true
            break
          }
        }
        if (!setDone) {
          setFeedback(`Field "${cmd.target}" not found.`)
        }
        break
      }

      // ── v3.0: Tool/Calculator Navigation ──
      case 'tooltool': {
        const toolName = cmd.target || ''
        const toolLabels: Record<string, string> = {
          sip: 'SIP Calculator', lump: 'Lump Sum Calculator', compound: 'Compound Interest',
          future: 'Future Value', present: 'Present Value', growth: 'Investment Growth',
          portfolio: 'Portfolio Return', cagr: 'CAGR Calculator', xirr: 'XIRR Calculator',
          irr: 'IRR Calculator', dividend: 'Dividend Yield', inflation: 'Inflation Calculator',
          risk: 'Risk vs Return', live: 'Live Markets', 'real-estate': 'Real Estate Tools',
          tax: 'Tax & Compliance', forex: 'Forex & Commodity', wealth: 'Wealth Planning',
          trading: 'Trading & Market', advanced: 'Advanced Investor',
        }
        const label = toolLabels[toolName] || toolName
        setFeedback(`Opening ${label}...`)
        speak(`Opening ${label}`)
        // Navigate to /tools/ first if not already there
        if (!window.location.pathname.includes('/tools')) {
          router.push('/tools/')
        }
        // After a delay, try to find and scroll to the tool
        setTimeout(() => {
          const selectors = [`#${toolName}`, `[data-tool="${toolName}"]`, `[id*="${toolName}"]`, `[data-id*="${toolName}"]`, `a[href*="${toolName}"]`]
          for (const sel of selectors) {
            try {
              const el = document.querySelector(sel) as HTMLElement
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.style.outline = '3px solid #D0021B'
                el.style.outlineOffset = '4px'
                setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = '' }, 4000)
                return
              }
            } catch {}
          }
          // Fallback: search text content
          const all = document.querySelectorAll('h2, h3, h4, a, button')
          for (const el of Array.from(all)) {
            if (el.textContent?.toLowerCase().includes(toolName)) {
              (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
              break
            }
          }
        }, window.location.pathname.includes('/tools') ? 200 : 1000)
        break
      }

      // ── v3.0: Additional Utility ──
      case 'toggletheme': {
        const isDark = document.documentElement.classList.contains('dark')
        if (isDark) {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('ghl-theme', 'light')
          setFeedback('Switched to light mode.')
          speak('Light mode.')
        } else {
          document.documentElement.classList.add('dark')
          localStorage.setItem('ghl-theme', 'dark')
          setFeedback('Switched to dark mode.')
          speak('Dark mode.')
        }
        break
      }
      case 'exitfullscreen': {
        if (document.fullscreenElement) {
          document.exitFullscreen()
          setFeedback('Exited fullscreen.')
          speak('Exited fullscreen.')
        } else {
          setFeedback('Not in fullscreen mode.')
        }
        break
      }
      case 'closepopup': {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        document.querySelectorAll('[aria-label="Close"], .modal-close, .close-btn').forEach(b => (b as HTMLElement).click())
        setFeedback('Closed overlays.')
        break
      }

      // ── v3.0: Quick Info (spoken answers) ──
      case 'phonenumber': {
        setFeedback('+91 7200 255 252 | +91 44 2843 1043')
        speak('Plus 91 7200 255 252, or office landline plus 91 44 2843 1043.')
        break
      }
      case 'emailaddress': {
        setFeedback('info@ghlindiaventures.com')
        speak('info at ghlindiaventures dot com')
        break
      }
      case 'issafe': {
        const safeMsg = 'GHL India Ventures is SEBI registered under Category 2 AIF with registration IN/AIF2/2425/1517. All investments are SEBI regulated. However, all investments carry market risk. Please read the PPM carefully.'
        setFeedback(safeMsg)
        speak(safeMsg)
        break
      }
      case 'howto': {
        const howMsg = 'Register on our website, choose your investment tier, and our team will guide you. Visit the sign up page to get started, or call us directly.'
        setFeedback(howMsg)
        speak(howMsg)
        setTimeout(() => router.push('/register/'), 2000)
        break
      }
      case 'whatreturns': {
        const retMsg = 'Returns depend on the specific investment tier and route you choose. GHL does not guarantee fixed returns as per SEBI regulations. Visit the Fund page for details or speak with our advisor.'
        setFeedback(retMsg)
        speak(retMsg)
        break
      }
      case 'minimuminvest': {
        const minMsg = 'The minimum investment for the Direct AIF Route is as per SEBI AIF Regulations. We also offer a SEBI Co-Invest Framework for professionals. Contact our team for details.'
        setFeedback(minMsg)
        speak(minMsg)
        break
      }

      case 'help': {
        const helpText = 'Commands: "Go to [page]", "Scroll up/down/top/bottom" (or Hindi: "upar/neeche"), "Next/Previous section", "Read page", "Stop/Pause/Resume", "Direct Call", "Call", "Email", "WhatsApp", "Telegram", "Video call", "Open chat", "Live chat", "Dark/Light/Toggle theme", "Zoom in/out/reset", "Font bigger/smaller/reset", "High contrast", "Highlight links", "Focus main", "Bookmark", "Calculator", "SIP/CAGR/XIRR/IRR calculator", "Live markets", "Tax tools", "Forex tools", "Name/Email/Phone/Message field", "Next/Previous field", "Submit/Clear form", "Type [text]", "Click [button]", "Set [field] to [value]", "Switch to [language]", "Search [query]", "Hello/Namaste/Vanakkam", "How to invest", "Minimum investment", "Is it safe", "What returns", "SEBI number", "Address", "Office hours", "Phone number", "Email address", "Share", "Print", "Fullscreen", "Refresh", "Close".'
        setFeedback(helpText)
        speak(helpText)
        break
      }
      default: {
        const page = findPage(raw)
        if (page) {
          setFeedback(`Navigating to ${page.label}...`)
          speak(`Going to ${page.label}`)
          setTimeout(() => router.push(page.href), 500)
        } else {
          setFeedback(`"${raw}" - not recognized. Say "help" for commands.`)
        }
      }
    }
  }, [router, speak, readPageContent, stopSpeaking, language, closeWidget])

  // ─── Start CONTINUOUS mic — stays on until "close" or manual stop ───
  const startContinuousMic = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setFeedback('Voice recognition not supported in this browser.')
      return
    }

    // Abort any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    intentionalStop.current = false

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US' // Always listen in English for commands
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      // Auto-restart unless intentionally stopped or widget closed
      if (!intentionalStop.current && !widgetClosed.current) {
        try {
          setTimeout(() => {
            if (!intentionalStop.current && !widgetClosed.current && recognitionRef.current) {
              recognitionRef.current.start()
            }
          }, 300)
        } catch {}
      } else {
        setIsListening(false)
      }
    }

    recognition.onerror = (event: any) => {
      // For non-fatal errors, let onend handle restart
      if (event.error === 'aborted' || event.error === 'no-speech') {
        // These are fine — mic will auto-restart via onend
        return
      }
      if (event.error === 'not-allowed') {
        setIsListening(false)
        setFeedback('Microphone access denied. Please allow microphone in browser settings and refresh.')
        intentionalStop.current = true
      } else if (event.error === 'network') {
        setFeedback('Network error. Mic will retry...')
      }
    }

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      if (result.isFinal) {
        setInputText(transcript)
        setFeedback(`Heard: "${transcript}"`)
        executeCommand(transcript)
      } else {
        setInputText(transcript)
        setFeedback(`Hearing: "${transcript}"...`)
      }
    }

    recognitionRef.current = recognition

    // Request mic permission first, then start
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop())
        try {
          recognition.start()
        } catch {
          setFeedback('Could not start voice recognition.')
        }
      })
      .catch((err: any) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setFeedback('Microphone access denied. Please allow mic in browser settings.')
        } else if (err.name === 'NotFoundError') {
          setFeedback('No microphone found. Please connect a microphone.')
        } else {
          setFeedback('Could not access microphone. Please type your command.')
        }
      })
  }, [executeCommand])

  // Manual mic toggle (for the button in the panel)
  const toggleMic = useCallback(() => {
    if (isListening) {
      intentionalStop.current = true
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsListening(false)
      setFeedback('Mic paused. Click mic button or say nothing to resume.')
    } else {
      startContinuousMic()
    }
  }, [isListening, startContinuousMic])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      executeCommand(inputText.trim())
      setInputText('')
    }
  }

  const togglePanel = () => {
    if (isOpen) {
      // Closing
      closeWidget()
    } else {
      // Opening
      widgetClosed.current = false
      setIsOpen(true)
      setShowPulse(false)
      setShowPrompt(false)
      setFeedback('Mic is ON. Speak a command or say "help".')
      setTimeout(() => {
        inputRef.current?.focus()
        startContinuousMic()
      }, 400)
    }
  }

  if (!mounted) return null

  const currentLang = LANGUAGES.find(l => l.code === language)

  return (
    <div id="ghl-voice-widget" data-ghl-widget="voice" style={{ pointerEvents: 'none' }}>
      {/* ── "Speak to navigate" floating prompt ── */}
      {showPrompt && !isOpen && (
        <div
          className="fixed z-[9993] animate-fade-in"
          style={{
            bottom: '60px',
            left: '16px',
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
            style={{
              background: 'rgba(10,10,10,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(208,2,27,0.3)',
              boxShadow: '0 8px 30px rgba(208,2,27,0.15), 0 4px 20px rgba(0,0,0,0.4)',
              animation: 'voice-prompt-bounce 2s ease-in-out infinite',
            }}
          >
            <Mic className="w-4 h-4 text-brand-red animate-pulse" />
            <span className="text-white font-semibold">Speak to navigate</span>
            <span className="text-gray-400 text-[10px] ml-1">or click to open</span>
          </div>
          <div
            className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45"
            style={{ background: 'rgba(10,10,10,0.92)', borderRight: '1px solid rgba(208,2,27,0.3)', borderBottom: '1px solid rgba(208,2,27,0.3)' }}
          />
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={togglePanel}
        className="fixed z-[9991] flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 hover:scale-105 group"
        style={{
          bottom: '28px',
          left: '16px',
          background: isOpen ? 'rgba(208,2,27,0.9)' : isListening ? 'rgba(208,2,27,0.7)' : 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isOpen ? 'rgba(208,2,27,0.3)' : isListening ? 'rgba(208,2,27,0.5)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isListening ? '0 4px 20px rgba(208,2,27,0.4)' : '0 4px 20px rgba(0,0,0,0.3)',
        }}
        title="Hey GHL \u2014 Voice Commands"
      >
        {showPulse && !isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(208,2,27,0.3)' }} />
        )}
        {isListening && !isOpen && (
          <span className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(208,2,27,0.2)' }} />
        )}
        <Mic className={`w-3 h-3 ${isOpen || isListening ? 'text-white' : 'text-brand-red'} transition-colors`} />
        <span className="text-gray-300 group-hover:text-white transition-colors">
          {isListening && !isOpen ? 'Listening...' : isOpen ? 'Close' : 'Hey GHL..'}
        </span>
      </button>

      {/* Command Panel */}
      <div
        className={`fixed z-[9992] transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ bottom: '60px', left: '16px', width: '330px', maxHeight: '500px' }}
      >
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-red/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-brand-red" />
              </div>
              <span className="text-white text-xs font-bold tracking-wide">GHL VOICE NAV</span>
              {isListening && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] text-red-400 font-medium">LIVE</span>
                </span>
              )}
              <span className="text-[9px] text-gray-500">{currentLang?.flag} {currentLang?.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowLangPicker(!showLangPicker)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Change language">
                <Globe className="w-3.5 h-3.5" />
              </button>
              {isSpeaking && (
                <button onClick={stopSpeaking} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors" title="Stop speaking">
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={closeWidget} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Close (or say &quot;close&quot;)">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Language picker */}
          {showLangPicker && (
            <div className="px-3 py-2 border-b border-white/10 max-h-[140px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangPicker(false)
                      setFeedback(`Language: ${lang.label}. TTS will read in ${lang.label}.`)
                      speak(`Language changed to ${lang.label}.`, lang.code)
                    }}
                    className={`text-[10px] px-2 py-1.5 rounded-lg transition-all ${
                      language === lang.code ? 'bg-brand-red text-white font-bold' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions — row 1: scroll + read */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { icon: <ChevronUp className="w-2.5 h-2.5" />, label: 'Up', action: () => executeCommand('scroll up') },
                { icon: <ChevronDown className="w-2.5 h-2.5" />, label: 'Down', action: () => executeCommand('scroll down') },
                { icon: <Navigation className="w-2.5 h-2.5" />, label: 'Top', action: () => executeCommand('scroll top') },
                { icon: <Navigation className="w-2.5 h-2.5 rotate-180" />, label: 'Bottom', action: () => executeCommand('scroll bottom') },
                { icon: <Volume2 className="w-2.5 h-2.5" />, label: 'Read', action: readPageContent },
                { icon: <Search className="w-2.5 h-2.5" />, label: 'Zoom+', action: () => executeCommand('zoom in') },
                { icon: <Search className="w-2.5 h-2.5" />, label: 'Zoom-', action: () => executeCommand('zoom out') },
                { icon: <Sun className="w-2.5 h-2.5" />, label: 'Contrast', action: () => executeCommand('high contrast') },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all">
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
            {/* Row 2: Contact shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {[
                { icon: <PhoneCall className="w-2.5 h-2.5" />, label: 'Direct Call', color: 'text-green-400', action: () => executeCommand('direct call') },
                { icon: <Phone className="w-2.5 h-2.5" />, label: 'Call', color: 'text-green-300', action: () => executeCommand('call') },
                { icon: <Mail className="w-2.5 h-2.5" />, label: 'Email', color: 'text-blue-400', action: () => executeCommand('email') },
                { icon: <MessageCircle className="w-2.5 h-2.5" />, label: 'WhatsApp', color: 'text-emerald-400', action: () => executeCommand('whatsapp') },
                { icon: <Send className="w-2.5 h-2.5" />, label: 'Telegram', color: 'text-sky-400', action: () => executeCommand('telegram') },
                { icon: <Video className="w-2.5 h-2.5" />, label: 'Video', color: 'text-purple-400', action: () => executeCommand('video call') },
                { icon: <Phone className="w-2.5 h-2.5" />, label: 'Get App', color: 'text-cyan-400', action: () => executeCommand('download app') },
                { icon: <Power className="w-2.5 h-2.5" />, label: 'Solutions', color: 'text-indigo-400', action: () => executeCommand('calling solutions') },
                { icon: <MessageCircle className="w-2.5 h-2.5" />, label: 'Live Chat', color: 'text-pink-400', action: () => executeCommand('live chat') },
                { icon: <Moon className="w-2.5 h-2.5" />, label: 'Dark', color: 'text-gray-300', action: () => executeCommand('dark mode') },
                { icon: <Sun className="w-2.5 h-2.5" />, label: 'Light', color: 'text-yellow-400', action: () => executeCommand('light mode') },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 ${btn.color} text-[10px] transition-all`}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pages list */}
          <div className="px-3 py-2 max-h-[150px] overflow-y-auto border-b border-white/10 scrollbar-thin">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Quick Nav \u2014 all pages</p>
            <div className="grid grid-cols-2 gap-1">
              {ALL_PAGES.map(page => {
                const isActive = pathname === page.href
                return (
                  <button
                    key={page.href}
                    onClick={() => {
                      setFeedback(`Navigating to ${page.label}...`)
                      speak(`Going to ${page.label}`)
                      setTimeout(() => router.push(page.href), 300)
                    }}
                    className={`text-left text-[10px] px-2.5 py-1.5 rounded-lg transition-all ${
                      isActive ? 'bg-brand-red/20 text-brand-red font-bold' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[10px] text-gray-300 leading-relaxed flex items-start gap-2">
                {isSpeaking && <Volume2 className="w-3 h-3 text-brand-red shrink-0 mt-0.5 animate-pulse" />}
                {isListening && !isSpeaking && <Mic className="w-3 h-3 text-brand-red shrink-0 mt-0.5 animate-pulse" />}
                <span>{feedback}</span>
              </p>
            </div>
          )}

          {/* Input area */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={toggleMic}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-brand-red text-white animate-pulse shadow-lg shadow-brand-red/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
              title={isListening ? 'Pause mic' : 'Resume mic'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening continuously...' : 'Type a command...'}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-500 outline-none focus:border-brand-red/50 transition-colors"
            />
            <button type="submit" className="shrink-0 w-8 h-8 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center transition-all">
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Bottom hint */}
          <div className="px-3 pb-2 text-center">
            <p className="text-[9px] text-gray-600">
              Mic stays on. Say <strong className="text-gray-400">&quot;close&quot;</strong> to exit or <strong className="text-gray-400">&quot;help&quot;</strong> for all commands.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
