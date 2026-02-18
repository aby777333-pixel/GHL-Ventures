// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Intent Classifier (Multilingual)
// Command parser, intent classification, navigation routing
// Supports: en, hi, ta, te, kn, ml + es, fr, de, ar, zh, ja, pt, ru
// ─────────────────────────────────────────────────────────────

import type {
  IntentType, IntentResult, IntentPattern, NavigationTarget,
  MessageAction, KnowledgeEntry, ConversationContext,
} from './types';

// ── Navigation Targets (English + Transliterated) ────────────

const NAV_TARGETS: Record<string, NavigationTarget> = {
  // English
  home:           { path: '/', label: 'Home' },
  about:          { path: '/about', label: 'About' },
  fund:           { path: '/fund', label: 'Fund' },
  blog:           { path: '/blog', label: 'Blog' },
  contact:        { path: '/contact', label: 'Contact' },
  portfolio:      { path: '/portfolio', label: 'Portfolio' },
  download:       { path: '/downloads', label: 'Downloads' },
  downloads:      { path: '/downloads', label: 'Downloads' },
  'financial iq': { path: '/financial-iq', label: 'Financial IQ' },
  financial:      { path: '/financial-iq', label: 'Financial IQ' },
  debenture:      { path: '/fund/debenture-route', label: 'Debenture Route' },
  'direct aif':   { path: '/fund/direct-aif', label: 'Direct AIF' },
  direct:         { path: '/fund/direct-aif', label: 'Direct AIF' },
  login:          { path: '/login', label: 'Login' },
  register:       { path: '/register', label: 'Register' },
  // Hindi
  '\u0918\u0930':             { path: '/', label: 'Home' },           // ghar
  '\u0939\u094B\u092E':           { path: '/', label: 'Home' },           // home
  '\u0939\u092E\u093E\u0930\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902':    { path: '/about', label: 'About' },      // hamare bare mein
  '\u092B\u0902\u0921':           { path: '/fund', label: 'Fund' },       // fund
  '\u0928\u093F\u0935\u0947\u0936':        { path: '/fund', label: 'Fund' },       // nivesh
  '\u092C\u094D\u0932\u0949\u0917':         { path: '/blog', label: 'Blog' },       // blog
  '\u0938\u0902\u092A\u0930\u094D\u0915':       { path: '/contact', label: 'Contact' }, // sampark
  '\u092A\u094B\u0930\u094D\u091F\u092B\u094B\u0932\u093F\u092F\u094B': { path: '/portfolio', label: 'Portfolio' },
  '\u0921\u093E\u0909\u0928\u0932\u094B\u0921':    { path: '/downloads', label: 'Downloads' },
  '\u0921\u093F\u092C\u0947\u0902\u091A\u0930':    { path: '/fund/debenture-route', label: 'Debenture' },
  '\u0932\u0949\u0917\u093F\u0928':        { path: '/login', label: 'Login' },
  '\u092A\u0902\u091C\u0940\u0915\u0930\u0923':    { path: '/register', label: 'Register' },
  // Tamil
  '\u0BAE\u0BC1\u0B95\u0BAA\u0BCD\u0BAA\u0BC1':     { path: '/', label: 'Home' },           // mugappu
  '\u0B8E\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAA\u0BB1\u0BCD\u0BB1\u0BBF': { path: '/about', label: 'About' },  // engal patri
  '\u0BA8\u0BBF\u0BA4\u0BBF':          { path: '/fund', label: 'Fund' },       // nithi
  '\u0BAE\u0BC1\u0BA4\u0BB2\u0BC0\u0B9F\u0BC1':     { path: '/fund', label: 'Fund' },       // muthaleedu
  '\u0BA4\u0BCA\u0B9F\u0BB0\u0BCD\u0BAA\u0BC1':     { path: '/contact', label: 'Contact' }, // thodarpu
  '\u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BB0\u0BC8':     { path: '/blog', label: 'Blog' },       // katturai
  '\u0BAA\u0BA4\u0BBF\u0BB5\u0BBF\u0BB1\u0B95\u0BCD\u0B95\u0BC1':  { path: '/downloads', label: 'Downloads' },
  // Telugu
  '\u0C07\u0C02\u0C1F\u0C3F\u0C15\u0C3F':       { path: '/', label: 'Home' },           // intiki
  '\u0C2E\u0C3E \u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F':  { path: '/about', label: 'About' },
  '\u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C41\u0C2C\u0C21\u0C3F':    { path: '/fund', label: 'Fund' },       // pettubadi
  '\u0C38\u0C02\u0C2A\u0C4D\u0C30\u0C26\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F': { path: '/contact', label: 'Contact' },
  // Kannada
  '\u0CAE\u0CA8\u0CC6\u0C97\u0CC6':         { path: '/', label: 'Home' },           // manege
  '\u0CA8\u0CAE\u0CCD\u0CAE \u0CAC\u0C97\u0CCD\u0C97\u0CC6':   { path: '/about', label: 'About' },
  '\u0CB9\u0CC2\u0CA1\u0CBF\u0C95\u0CC6':       { path: '/fund', label: 'Fund' },       // hoodike
  '\u0CB8\u0C82\u0CAA\u0CB0\u0CCD\u0C95\u0CBF\u0CB8\u0CBF':   { path: '/contact', label: 'Contact' },
  // Malayalam
  '\u0D35\u0D40\u0D1F\u0D4D':          { path: '/', label: 'Home' },           // veedu
  '\u0D15\u0D41\u0D31\u0D3F\u0D1A\u0D4D\u0D1A\u0D4D':     { path: '/about', label: 'About' },     // kurichu
  '\u0D28\u0D3F\u0D15\u0D4D\u0D37\u0D47\u0D2A\u0D02':    { path: '/fund', label: 'Fund' },       // nikshepam
  '\u0D38\u0D02\u0D2A\u0D30\u0D4D\u0D15\u0D4D\u0D15\u0D02':   { path: '/contact', label: 'Contact' },
};

// ── Multilingual Navigation Patterns ────────────────────────

const MULTILINGUAL_NAV_PATTERNS: RegExp[] = [
  // English
  /(?:go to|take me to|open|navigate to|show me|visit)\s+(.+)/i,
  /(.+)\s+page/i,
  // Hindi: X पर जाओ, X दिखाओ, X खोलो
  /(.+)\s+(?:\u092A\u0930\s+\u091C\u093E\u0913|\u0926\u093F\u0916\u093E\u0913|\u0916\u094B\u0932\u094B|\u092A\u0947\u091C\s+\u0916\u094B\u0932\u094B)/i,
  /(?:\u092E\u0941\u091D\u0947\s+)?(?:\u0926\u093F\u0916\u093E\u0913|\u0932\u0947\s+\u091C\u093E\u0913|\u091C\u093E\u0913)\s+(.+)/i,
  // Tamil: X-க்கு போ, X திற, X காட்டு
  /(.+)\s*(?:\u0B95\u0BCD\u0B95\u0BC1\s+\u0BAA\u0BCB|\u0BA4\u0BBF\u0BB1|\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1)/i,
  /(?:\u0B8E\u0BA9\u0BCD\u0BA9\u0BC8\s+)?(?:\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1|\u0BA4\u0BBF\u0BB1\u0B95\u0BCD\u0B95|\u0BAA\u0BCB\u0B95)/i,
  // Telugu: X చూపించు, X కి వెళ్ళు, X తెరువు
  /(.+)\s*(?:\u0C1A\u0C42\u0C2A\u0C3F\u0C02\u0C1A\u0C41|\u0C15\u0C3F\s+\u0C35\u0C46\u0C33\u0C4D\u0C33\u0C41|\u0C24\u0C46\u0C30\u0C41\u0C35\u0C41)/i,
  // Kannada: X ತೋರಿಸಿ, X ಗೆ ಹೋಗಿ, X ತೆರೆ
  /(.+)\s*(?:\u0CA4\u0CCB\u0CB0\u0CBF\u0CB8\u0CBF|\u0C97\u0CC6\s+\u0CB9\u0CCB\u0C97\u0CBF|\u0CA4\u0CC6\u0CB0\u0CC6)/i,
  // Malayalam: X കാണിക്കൂ, X-ലേക്ക് പോകൂ, X തുറക്കൂ
  /(.+)\s*(?:\u0D15\u0D3E\u0D23\u0D3F\u0D15\u0D4D\u0D15\u0D42|\u0D32\u0D47\u0D15\u0D4D\u0D15\u0D4D\s+\u0D2A\u0D4B\u0D15\u0D42|\u0D24\u0D41\u0D31\u0D15\u0D4D\u0D15\u0D42)/i,
];

// ── Intent Patterns (Multilingual) ──────────────────────────

const INTENT_PATTERNS: IntentPattern[] = [
  // ── Greetings (all languages) ──
  { intent: 'greeting', keywords: [
    'hello', 'hi', 'hey', 'good morning', 'good evening', 'howdy',
    'namaste', '\u0928\u092E\u0938\u094D\u0924\u0947', '\u0928\u092E\u0938\u094D\u0915\u093E\u0930',
    'vanakkam', '\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD',
    'namaskar', 'namaskaaram', '\u0C28\u0C2E\u0C38\u0C4D\u0C15\u0C3E\u0C30\u0C02', '\u0C28\u0C2E\u0C38\u0C4D\u0C15\u0C3E\u0C30\u0C3E\u0C32\u0C41',
    '\u0CA8\u0CAE\u0CB8\u0CCD\u0C95\u0CBE\u0CB0', '\u0CA8\u0CAE\u0CB8\u0CCD\u0CA4\u0CC6',
    '\u0D28\u0D2E\u0D38\u0D4D\u0D15\u0D3E\u0D30\u0D02', '\u0D28\u0D2E\u0D38\u0D4D\u0D24\u0D47',
    'hola', 'bonjour', 'hallo', 'guten tag',
    '\u0645\u0631\u062D\u0628\u0627', '\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645',
    '\u4F60\u597D', '\u3053\u3093\u306B\u3061\u306F', 'ol\u00E1',
    '\u0437\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435', '\u043F\u0440\u0438\u0432\u0435\u0442',
  ], priority: 1 },

  // ── Thanks ──
  { intent: 'thanks', keywords: [
    'thank', 'thanks', 'appreciate',
    '\u0927\u0928\u094D\u092F\u0935\u093E\u0926', '\u0936\u0941\u0915\u094D\u0930\u093F\u092F\u093E', 'shukriya', 'dhanyavaad',
    '\u0BA8\u0BA9\u0BCD\u0BB1\u0BBF', 'nandri',
    '\u0C27\u0C28\u0C4D\u0C2F\u0C35\u0C3E\u0C26\u0C3E\u0C32\u0C41',
    '\u0CA7\u0CA8\u0CCD\u0CAF\u0CB5\u0CBE\u0CA6',
    '\u0D28\u0D28\u0D4D\u0D26\u0D3F',
    'gracias', 'merci', 'danke', '\u0634\u0643\u0631\u0627', '\u8C22\u8C22', '\u3042\u308A\u304C\u3068\u3046', 'obrigado', '\u0441\u043F\u0430\u0441\u0438\u0431\u043E',
  ], priority: 1 },

  // ── Goodbye ──
  { intent: 'goodbye', keywords: [
    'bye', 'goodbye', 'see you', 'later', 'take care',
    '\u0905\u0932\u0935\u093F\u0926\u093E', '\u092B\u093F\u0930 \u092E\u093F\u0932\u0947\u0902\u0917\u0947', 'alvida',
    '\u0BAA\u0BCB\u0BAF\u0BCD \u0BB5\u0BB0\u0BC1\u0B95\u0BBF\u0BB1\u0BC7\u0BA9\u0BCD', 'poi varukiren',
    '\u0CB9\u0CCB\u0C97\u0CBF \u0CAC\u0CB0\u0CC1\u0CA4\u0CCD\u0CA4\u0CC7\u0CA8\u0CC6',
    '\u0D2A\u0D4B\u0D2F\u0D3F \u0D35\u0D30\u0D3E\u0D02',
    'adi\u00F3s', 'au revoir', 'tsch\u00FCss', '\u0645\u0639 \u0627\u0644\u0633\u0644\u0627\u0645\u0629', '\u518D\u89C1', '\u3055\u3088\u306A\u3089', 'tchau', '\u0434\u043E \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F',
  ], priority: 1 },

  // ── Company & Fund ──
  { intent: 'about_company', keywords: [
    'about', 'company', 'ghl', 'who are you', 'what is ghl', 'tell me about',
    '\u0915\u0902\u092A\u0928\u0940', '\u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u092C\u0924\u093E\u0913', '\u0915\u094C\u0928 \u0939\u094B',
    '\u0BA8\u0BBF\u0BB1\u0BC1\u0BB5\u0BA9\u0BAE\u0BCD', '\u0BAA\u0BB1\u0BCD\u0BB1\u0BBF \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BC1',
    '\u0C15\u0C02\u0C2A\u0C46\u0C28\u0C40', '\u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F \u0C1A\u0C46\u0C2A\u0C4D\u0C2A\u0C02\u0C21\u0C3F',
    '\u0C95\u0C82\u0CAA\u0CA8\u0CBF', '\u0CAC\u0C97\u0CCD\u0C97\u0CC6 \u0CB9\u0CC7\u0CB3\u0CBF',
    '\u0D15\u0D02\u0D2A\u0D28\u0D3F', '\u0D15\u0D41\u0D31\u0D3F\u0D1A\u0D4D\u0D1A\u0D4D \u0D2A\u0D31\u0D2F\u0D42',
  ], priority: 3 },

  { intent: 'about_fund', keywords: [
    'fund', 'aif', 'alternative investment', 'what fund', 'explain fund',
    '\u092B\u0902\u0921', '\u0928\u093F\u0935\u0947\u0936 \u0915\u094B\u0937', '\u090F\u0906\u0908\u090F\u092B',
    '\u0BA8\u0BBF\u0BA4\u0BBF', '\u0BAE\u0BC1\u0BA4\u0BB2\u0BC0\u0B9F\u0BC1',
    '\u0C2B\u0C02\u0C21\u0C4D', '\u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C41\u0C2C\u0C21\u0C3F',
    '\u0CAB\u0C82\u0CA1\u0CCD', '\u0CB9\u0CC2\u0CA1\u0CBF\u0C95\u0CC6',
    '\u0D2B\u0D23\u0D4D\u0D1F\u0D4D', '\u0D28\u0D3F\u0D15\u0D4D\u0D37\u0D47\u0D2A\u0D02',
  ], priority: 4 },

  { intent: 'about_sebi', keywords: [
    'sebi', 'registered', 'regulation', 'category ii', 'regulatory', 'license',
    '\u0938\u0947\u092C\u0940', '\u092A\u0902\u091C\u0940\u0915\u0943\u0924', '\u0928\u093F\u092F\u093E\u092E\u0915',
  ], priority: 4 },

  { intent: 'about_team', keywords: [
    'team', 'founder', 'who runs', 'management', 'leadership',
    '\u091F\u0940\u092E', '\u0938\u0902\u0938\u094D\u0925\u093E\u092A\u0915', '\u092A\u094D\u0930\u092C\u0902\u0927\u0928',
    '\u0B95\u0BC1\u0BB4\u0BC1', '\u0BA8\u0BBF\u0BB1\u0BC1\u0BB5\u0BA9\u0BB0\u0BCD',
    '\u0C1F\u0C40\u0C2E\u0C4D', '\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C4D\u0C25\u0C3E\u0C2A\u0C15\u0C41\u0C21\u0C41',
  ], priority: 3 },

  // ── Investment Topics ──
  { intent: 'investment_start', keywords: [
    'invest', 'start investing', 'how to invest', 'get started', 'i want to invest',
    '\u0928\u093F\u0935\u0947\u0936 \u0915\u0930\u0928\u093E', '\u0928\u093F\u0935\u0947\u0936 \u0915\u0948\u0938\u0947 \u0915\u0930\u0947\u0902', '\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902',
    '\u0BAE\u0BC1\u0BA4\u0BB2\u0BC0\u0B9F\u0BC1 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF', '\u0B8E\u0BAA\u0BCD\u0BAA\u0B9F\u0BBF \u0BAE\u0BC1\u0BA4\u0BB2\u0BC0\u0B9F\u0BC1',
    '\u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C41\u0C2C\u0C21\u0C3F \u0C1A\u0C47\u0C2F\u0C3E\u0C32\u0C3F', '\u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C41\u0C2C\u0C21\u0C3F \u0C0E\u0C32\u0C3E',
    '\u0CB9\u0CC2\u0CA1\u0CBF\u0C95\u0CC6 \u0CAE\u0CBE\u0CA1\u0CC1', '\u0CB9\u0CC2\u0CA1\u0CBF\u0C95\u0CC6 \u0CB9\u0CC7\u0C97\u0CC6',
    '\u0D28\u0D3F\u0D15\u0D4D\u0D37\u0D47\u0D2A\u0D3F\u0D15\u0D4D\u0D15\u0D3E\u0D28\u0D4D', '\u0D28\u0D3F\u0D15\u0D4D\u0D37\u0D47\u0D2A\u0D02 \u0D0E\u0D19\u0D4D\u0D19\u0D28\u0D46',
  ], priority: 5 },

  { intent: 'minimum_investment', keywords: [
    'minimum', 'minimum investment', 'how much', 'entry amount', '1 crore', 'one crore', '10 lakh',
    '\u0928\u094D\u092F\u0942\u0928\u0924\u092E', '\u0915\u093F\u0924\u0928\u093E \u092A\u0948\u0938\u093E', '\u090F\u0915 \u0915\u0930\u094B\u0921\u093C', '\u0926\u0938 \u0932\u093E\u0916',
    '\u0B95\u0BC1\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4\u0BAA\u0B9F\u0BCD\u0B9A\u0BAE\u0BCD', '\u0B8E\u0BB5\u0BCD\u0BB5\u0BB3\u0BB5\u0BC1',
    '\u0C0E\u0C02\u0C24', '\u0C15\u0C28\u0C40\u0C38\u0C02',
    '\u0C8E\u0CB7\u0CCD\u0C9F\u0CC1', '\u0C95\u0CA8\u0CBF\u0CB7\u0CCD\u0CA0',
    '\u0D0E\u0D24\u0D4D\u0D30', '\u0D15\u0D41\u0D31\u0D1E\u0D4D\u0D1E\u0D24\u0D4D',
  ], priority: 5 },

  { intent: 'returns', keywords: [
    'returns', 'irr', 'expected return', 'performance', 'yield', 'profit',
    '\u0930\u093F\u091F\u0930\u094D\u0928', '\u0932\u093E\u092D', '\u092E\u0941\u0928\u093E\u092B\u093E', '\u092A\u094D\u0930\u0926\u0930\u094D\u0936\u0928',
    '\u0BB2\u0BBE\u0BAA\u0BAE\u0BCD', '\u0BB5\u0BB0\u0BC1\u0BAE\u0BBE\u0BA9\u0BAE\u0BCD',
    '\u0C32\u0C3E\u0C2D\u0C02', '\u0C30\u0C3F\u0C1F\u0C30\u0C4D\u0C28\u0C4D',
  ], priority: 4 },

  { intent: 'risk', keywords: [
    'risk', 'risky', 'safe', 'safety', 'lose money', 'guarantee',
    '\u091C\u094B\u0916\u093F\u092E', '\u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924', '\u092A\u0948\u0938\u093E \u0916\u094B\u0928\u093E',
    '\u0B86\u0BAA\u0BA4\u0BCD\u0BA4\u0BC1', '\u0BAA\u0BBE\u0BA4\u0BC1\u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0BBE\u0BA9',
    '\u0C30\u0C3F\u0C38\u0C4D\u0C15\u0C4D', '\u0C2D\u0C26\u0C4D\u0C30\u0C24',
  ], priority: 4 },

  { intent: 'real_estate', keywords: ['real estate', 'property', 'stressed asset', 'nclt', '\u0930\u093F\u092F\u0932 \u090F\u0938\u094D\u091F\u0947\u091F', '\u0938\u0902\u092A\u0924\u094D\u0924\u093F'], priority: 4 },
  { intent: 'startups', keywords: ['startup', 'early stage', 'venture', 'tech', '\u0938\u094D\u091F\u093E\u0930\u094D\u091F\u0905\u092A'], priority: 3 },
  { intent: 'portfolio', keywords: ['portfolio', 'companies', 'investments', 'holdings', '\u092A\u094B\u0930\u094D\u091F\u092B\u094B\u0932\u093F\u092F\u094B', '\u0915\u0902\u092A\u0928\u093F\u092F\u093E\u0902'], priority: 3 },
  { intent: 'debenture', keywords: ['debenture', 'ncd', 'fixed income', 'debt', '10 lakh', '\u0921\u093F\u092C\u0947\u0902\u091A\u0930'], priority: 5 },
  { intent: 'direct_aif', keywords: ['direct aif', 'category ii', 'direct route', '1 crore', '\u0921\u093E\u092F\u0930\u0947\u0915\u094D\u091F'], priority: 5 },
  { intent: 'compare_routes', keywords: ['compare', 'difference', 'which is better', 'vs', '\u0924\u0941\u0932\u0928\u093E', '\u0905\u0902\u0924\u0930'], priority: 4 },
  { intent: 'fd_comparison', keywords: ['fixed deposit', 'fd', 'bank', 'mutual fund', 'pms', '\u090F\u092B\u0921\u0940', '\u092C\u0948\u0902\u0915'], priority: 3 },
  { intent: 'eligibility', keywords: ['eligible', 'eligibility', 'who can invest', 'hni', '\u092A\u093E\u0924\u094D\u0930\u0924\u093E', '\u092F\u094B\u0917\u094D\u092F\u0924\u093E'], priority: 3 },
  { intent: 'tenure', keywords: ['tenure', 'lock in', 'how long', 'duration', 'period', '\u0905\u0935\u0927\u093F', '\u0915\u093F\u0924\u0928\u0947 \u0938\u093E\u0932'], priority: 3 },
  { intent: 'exit_mechanism', keywords: ['exit', 'withdraw', 'redeem', 'liquidity', '\u0928\u093F\u0915\u093E\u0938\u0940', '\u0928\u093F\u0915\u093E\u0932\u0928\u093E'], priority: 3 },
  { intent: 'nri', keywords: ['nri', 'non resident', 'abroad', 'overseas', '\u0935\u093F\u0926\u0947\u0936\u0940', '\u092A\u094D\u0930\u0935\u093E\u0938\u0940'], priority: 3 },
  { intent: 'tax', keywords: ['tax', 'taxation', 'capital gains', '\u0915\u0930', '\u091F\u0948\u0915\u094D\u0938'], priority: 3 },
  { intent: 'kyc', keywords: ['kyc', 'documents', 'documentation', 'paperwork', '\u0926\u0938\u094D\u0924\u093E\u0935\u0947\u091C\u093C', '\u0915\u093E\u0917\u091C\u093E\u0924'], priority: 3 },
  { intent: 'reporting', keywords: ['report', 'nav', 'statement', 'quarterly', '\u0930\u093F\u092A\u094B\u0930\u094D\u091F'], priority: 2 },
  { intent: 'complaint', keywords: ['complaint', 'grievance', 'issue', '\u0936\u093F\u0915\u093E\u092F\u0924', '\u0938\u092E\u0938\u094D\u092F\u093E'], priority: 2 },
  { intent: 'ppm', keywords: ['ppm', 'placement memorandum', 'brochure', '\u092C\u094D\u0930\u094B\u0936\u0930'], priority: 2 },

  // ── Navigation & Actions (multilingual) ──
  { intent: 'navigate', keywords: [
    'go to', 'take me', 'show me', 'open', 'navigate', 'visit', 'page',
    '\u091C\u093E\u0913', '\u0926\u093F\u0916\u093E\u0913', '\u0916\u094B\u0932\u094B', '\u092A\u0947\u091C',
    '\u0BAA\u0BCB', '\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1', '\u0BA4\u0BBF\u0BB1', '\u0BAA\u0B95\u0BCD\u0B95\u0BAE\u0BCD',
    '\u0C35\u0C46\u0C33\u0C4D\u0C33\u0C41', '\u0C1A\u0C42\u0C2A\u0C3F\u0C02\u0C1A\u0C41', '\u0C24\u0C46\u0C30\u0C41\u0C35\u0C41', '\u0C2A\u0C47\u0C1C\u0C40',
    '\u0CB9\u0CCB\u0C97\u0CBF', '\u0CA4\u0CCB\u0CB0\u0CBF\u0CB8\u0CBF', '\u0CA4\u0CC6\u0CB0\u0CC6',
    '\u0D2A\u0D4B\u0D15\u0D42', '\u0D15\u0D3E\u0D23\u0D3F\u0D15\u0D4D\u0D15\u0D42', '\u0D24\u0D41\u0D31\u0D15\u0D4D\u0D15\u0D42',
  ], priority: 5 },

  { intent: 'contact', keywords: [
    'contact', 'reach', 'get in touch', 'office', 'address',
    '\u0938\u0902\u092A\u0930\u094D\u0915', '\u092A\u0924\u093E', '\u0926\u092B\u094D\u0924\u0930',
    '\u0BA4\u0BCA\u0B9F\u0BB0\u0BCD\u0BAA\u0BC1', '\u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF',
    '\u0C38\u0C02\u0C2A\u0C4D\u0C30\u0C26\u0C3F\u0C02\u0C1A\u0C41', '\u0C1A\u0C3F\u0C30\u0C41\u0C28\u0C3E\u0C2E\u0C3E',
    '\u0CB8\u0C82\u0CAA\u0CB0\u0CCD\u0C95\u0CBF\u0CB8\u0CBF', '\u0CB5\u0CBF\u0CB3\u0CBE\u0CB8',
    '\u0D38\u0D02\u0D2A\u0D30\u0D4D\u0D15\u0D4D\u0D15\u0D02', '\u0D35\u0D3F\u0D32\u0D3E\u0D38\u0D02',
  ], priority: 3 },

  { intent: 'whatsapp', keywords: ['whatsapp', 'whats app', '\u0935\u0949\u091F\u094D\u0938\u090F\u092A', '\u0BB5\u0BBE\u0B9F\u0BCD\u0BB8\u0BCD\u0B8F\u0BAA\u0BCD'], priority: 4 },
  { intent: 'call', keywords: [
    'call', 'phone', 'ring', 'dial',
    '\u0915\u0949\u0932', '\u092B\u094B\u0928', '\u092C\u0941\u0932\u093E\u0913',
    '\u0B85\u0BB4\u0BC8', '\u0BAA\u0BCB\u0BA9\u0BCD',
    '\u0C2B\u0C4B\u0C28\u0C4D', '\u0C15\u0C3E\u0C32\u0C4D',
    '\u0CAB\u0CCB\u0CA8\u0CCD', '\u0C95\u0CB0\u0CC6',
    '\u0D2B\u0D4B\u0D23\u0D4D', '\u0D35\u0D3F\u0D33\u0D3F\u0D15\u0D4D\u0D15\u0D42',
  ], priority: 4 },
  { intent: 'email', keywords: ['email', 'mail', '\u0908\u092E\u0947\u0932', '\u0BAE\u0BC6\u0BAF\u0BBF\u0BB2\u0BCD'], priority: 3 },
  { intent: 'human', keywords: [
    'human', 'real person', 'speak to someone', 'agent', 'representative',
    '\u0907\u0902\u0938\u093E\u0928', '\u0935\u094D\u092F\u0915\u094D\u0924\u093F', '\u0905\u0938\u0932\u0940 \u0907\u0902\u0938\u093E\u0928',
    '\u0BAE\u0BA9\u0BBF\u0BA4\u0BB0\u0BBF\u0B9F\u0BAE\u0BCD', '\u0B86\u0BB3\u0BBF\u0B9F\u0BAE\u0BCD',
    '\u0C2E\u0C28\u0C3F\u0C37\u0C3F\u0C24\u0C4B', '\u0C35\u0C4D\u0C2F\u0C15\u0C4D\u0C24\u0C3F\u0C24\u0C4B',
  ], priority: 4 },
  { intent: 'blog', keywords: ['blog', 'article', 'latest post', 'insights', '\u092C\u094D\u0932\u0949\u0917', '\u0932\u0947\u0916', '\u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BB0\u0BC8'], priority: 2 },
  { intent: 'read_page', keywords: [
    'read this', 'read page', 'read aloud', 'read to me',
    '\u092A\u0922\u093C\u094B', '\u092A\u0922\u093C \u0915\u0930 \u0938\u0941\u0928\u093E\u0913',
    '\u0BAA\u0B9F\u0BBF', '\u0BAA\u0B9F\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD',
    '\u0C1A\u0C26\u0C35\u0C02\u0C21\u0C3F', '\u0C1A\u0C26\u0C41\u0C35\u0C41',
    '\u0C93\u0CA6\u0CBF', '\u0C93\u0CA6\u0CC1',
    '\u0D35\u0D3E\u0D2F\u0D3F\u0D15\u0D4D\u0D15\u0D42',
  ], priority: 3 },
  { intent: 'quiz', keywords: [
    'quiz', 'risk quiz', 'assessment', 'risk profile',
    '\u0915\u094D\u0935\u093F\u091C\u093C', '\u091C\u094B\u0916\u093F\u092E \u092A\u0930\u0940\u0915\u094D\u0937\u093E',
    '\u0B95\u0BC1\u0BB5\u0BBF\u0BB8\u0BCD', '\u0BAA\u0BB0\u0BBF\u0B9F\u0BCD\u0B9A\u0BC8',
    '\u0C15\u0C4D\u0C35\u0C3F\u0C1C\u0C4D',
    '\u0C95\u0CCD\u0CB5\u0CBF\u0C9C\u0CCD',
    '\u0D15\u0D4D\u0D35\u0D3F\u0D38\u0D4D',
  ], priority: 3 },
  { intent: 'calculator', keywords: [
    'calculator', 'calculate', 'sip', 'roi',
    '\u0915\u0948\u0932\u0915\u0941\u0932\u0947\u091F\u0930', '\u0917\u0923\u0928\u093E',
    '\u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BBF',
    '\u0C15\u0C4D\u0C2F\u0C3E\u0C32\u0C4D\u0C15\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D',
    '\u0C95\u0CCD\u0CAF\u0CBE\u0CB2\u0CCD\u0C95\u0CC1\u0CB2\u0CC7\u0C9F\u0CB0\u0CCD',
  ], priority: 3 },

  // ── System Commands (multilingual) ──
  { intent: 'switch_character', keywords: ['switch to abe', 'switch to tina', 'talk to abe', 'talk to tina', '\u090F\u092C\u0947 \u0938\u0947 \u092C\u093E\u0924', '\u091F\u0940\u0928\u093E \u0938\u0947 \u092C\u093E\u0924'], priority: 5 },
  { intent: 'change_language', keywords: [
    'change language', 'switch language', 'speak in',
    '\u092D\u093E\u0937\u093E \u092C\u0926\u0932\u094B', '\u092D\u093E\u0937\u093E \u092C\u0926\u0932\u0947\u0902',
    '\u0BAE\u0BCA\u0BB4\u0BBF \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BC1',
    '\u0C2D\u0C3E\u0C37 \u0C2E\u0C3E\u0C30\u0C4D\u0C1A\u0C41',
    'tamil', 'hindi', 'telugu', 'kannada', 'malayalam',
    '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD', '\u0939\u093F\u0902\u0926\u0940', '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41', '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1', '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02',
  ], priority: 4 },
  { intent: 'repeat_last', keywords: [
    'repeat', 'say again', 'come again',
    '\u0926\u094B\u092C\u093E\u0930\u093E', '\u092B\u093F\u0930 \u0938\u0947 \u092C\u094B\u0932\u094B',
    '\u0BAE\u0BB1\u0BC1\u0BAA\u0B9F\u0BBF\u0BAF\u0BC1\u0BAE\u0BCD', '\u0BAE\u0BC0\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD',
  ], priority: 3 },
  { intent: 'stop_speaking', keywords: [
    'stop', 'quiet', 'silence', 'mute', 'stop talking',
    '\u0930\u0941\u0915\u094B', '\u091A\u0941\u092A', '\u092C\u0902\u0926 \u0915\u0930\u094B',
    '\u0BA8\u0BBF\u0BB1\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1', '\u0BA8\u0BBF\u0BB1\u0BCD\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BBF',
    '\u0C06\u0C2A\u0C41', '\u0C06\u0C2A\u0C47\u0C2F\u0C02\u0C21\u0C3F',
    '\u0CA8\u0CBF\u0CB2\u0CCD\u0CB2\u0CBF\u0CB8\u0CBF',
    '\u0D28\u0D3F\u0D7C\u0D24\u0D4D\u0D24\u0D42',
  ], priority: 5 },
  { intent: 'slow_down', keywords: ['slow down', 'slower', 'too fast', '\u0927\u0940\u0930\u0947', '\u0927\u0940\u092E\u0947 \u092C\u094B\u0932\u094B', '\u0BAE\u0BC6\u0BA4\u0BC1\u0BB5\u0BBE\u0B95'], priority: 4 },
  { intent: 'start_over', keywords: [
    'start over', 'reset', 'begin again', 'fresh start',
    '\u0928\u090F \u0938\u093F\u0930\u0947 \u0938\u0947', '\u0926\u094B\u092C\u093E\u0930\u093E \u0936\u0941\u0930\u0942',
    '\u0BAE\u0BC0\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BC1',
  ], priority: 3 },
  { intent: 'help', keywords: [
    'help', 'help me', 'assist', 'what can you do', 'guide',
    '\u092E\u0926\u0926', '\u0938\u0939\u093E\u092F\u0924\u093E', '\u0915\u094D\u092F\u093E \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u094B',
    '\u0B89\u0BA4\u0BB5\u0BBF', '\u0B8E\u0BA9\u0BCD\u0BA9 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF \u0BAE\u0BC1\u0B9F\u0BBF\u0BAF\u0BC1\u0BAE\u0BCD',
    '\u0C38\u0C39\u0C3E\u0C2F\u0C02', '\u0C0F\u0C02 \u0C1A\u0C47\u0C2F\u0C17\u0C32\u0C30\u0C41',
    '\u0CB8\u0CB9\u0CBE\u0CAF', '\u0C8F\u0CA8\u0CC1 \u0CAE\u0CBE\u0CA1\u0CAC\u0CB9\u0CC1\u0CA6\u0CC1',
    '\u0D38\u0D39\u0D3E\u0D2F\u0D02', '\u0D0E\u0D28\u0D4D\u0D24\u0D4A\u0D15\u0D4D\u0D15\u0D46 \u0D1A\u0D46\u0D2F\u0D4D\u0D2F\u0D3E\u0D02',
  ], priority: 2 },

  // ── UI / Scroll / Theme (multilingual) ──
  { intent: 'scroll_top', keywords: [
    'scroll up', 'top', 'go up', 'back to top',
    '\u090A\u092A\u0930 \u091C\u093E\u0913', '\u0936\u0940\u0930\u094D\u0937',
    '\u0BAE\u0BC7\u0BB2\u0BC7 \u0BAA\u0BCB',
    '\u0C2A\u0C48\u0C15\u0C3F',
    '\u0CAE\u0CC7\u0CB2\u0CC6',
    '\u0D2E\u0D41\u0D15\u0D33\u0D3F\u0D32\u0D47\u0D15\u0D4D\u0D15\u0D4D',
  ], priority: 3 },
  { intent: 'scroll_down', keywords: [
    'scroll down', 'go down', 'next section', 'more', 'continue',
    '\u0928\u0940\u091A\u0947 \u091C\u093E\u0913', '\u0914\u0930 \u0926\u093F\u0916\u093E\u0913', '\u0906\u0917\u0947',
    '\u0B95\u0BC0\u0BB4\u0BC7 \u0BAA\u0BCB',
    '\u0C15\u0C3F\u0C02\u0C26\u0C15\u0C3F',
    '\u0C95\u0CC6\u0CB3\u0C97\u0CC6',
    '\u0D24\u0D3E\u0D34\u0D47\u0D15\u0D4D\u0D15\u0D4D',
  ], priority: 2 },
  { intent: 'dark_mode', keywords: [
    'dark mode', 'light mode', 'toggle theme', 'night mode', 'theme',
    '\u0921\u093E\u0930\u094D\u0915 \u092E\u094B\u0921', '\u0925\u0940\u092E',
  ], priority: 3 },
  { intent: 'search', keywords: [
    'search', 'find', 'look for',
    '\u0916\u094B\u091C\u094B', '\u0922\u0942\u0902\u0922\u094B',
    '\u0BA4\u0BC7\u0B9F\u0BC1',
    '\u0CB9\u0CC1\u0CA1\u0CC1\u0C95\u0CBF',
    '\u0D24\u0D3F\u0D30\u0D2F\u0D42',
  ], priority: 2 },

  // ── General Conversation ──
  { intent: 'humor', keywords: ['joke', 'funny', 'humor', '\u091A\u0941\u091F\u0915\u0941\u0932\u093E', '\u0939\u0901\u0938\u093E\u0913', '\u0BA8\u0B95\u0BC8\u0B9A\u0BCD\u0B9A\u0BC1\u0BB5\u0BC8'], priority: 3 },
  { intent: 'philosophy', keywords: ['philosophy', 'meaning of life', 'wisdom', '\u0926\u0930\u094D\u0936\u0928', '\u091C\u0940\u0935\u0928'], priority: 2 },
  { intent: 'life_advice', keywords: ['advice', 'suggestion', 'what should i', '\u0938\u0932\u093E\u0939', '\u0938\u0941\u091D\u093E\u0935'], priority: 2 },
  { intent: 'general_knowledge', keywords: ['what is', 'tell me about', 'explain', 'how does', '\u0915\u094D\u092F\u093E \u0939\u0948', '\u092C\u0924\u093E\u0913', '\u0B8E\u0BA9\u0BCD\u0BA9', '\u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD'], priority: 1 },

  // ── Emotional ──
  { intent: 'distress', keywords: [
    'scared', 'worried', 'confused', 'overwhelmed',
    '\u0921\u0930\u093E \u0939\u0941\u0906', '\u091A\u093F\u0902\u0924\u093F\u0924', '\u0909\u0932\u091D\u0928',
    '\u092A\u092F\u0902', '\u0BAA\u0BAF\u0BAE\u0BCD',
  ], priority: 4 },
  { intent: 'name_response', keywords: ['my name is', 'i am', 'call me', '\u092E\u0947\u0930\u093E \u0928\u093E\u092E', '\u0BA8\u093E\u0BA9\u0BCD', '\u0B8E\u0BA9\u0BCD \u0BAA\u0BC6\u0BAF\u0BB0\u0BCD'], priority: 5 },
];

// ── Intent Classifier ────────────────────────────────────────

export class IntentClassifier {
  private patterns: IntentPattern[];
  private extraKnowledge: KnowledgeEntry[];

  constructor(knowledgeBase?: KnowledgeEntry[]) {
    this.patterns = [...INTENT_PATTERNS];
    this.extraKnowledge = knowledgeBase || [];
  }

  classify(input: string, context?: ConversationContext): IntentResult {
    const lower = input.toLowerCase().trim();
    if (!lower) return this.unknownResult();

    // Fast path: check navigation commands first
    const navResult = this.classifyNavigation(lower);
    if (navResult && navResult.confidence > 0.7) {
      return {
        intent: 'navigate',
        confidence: navResult.confidence,
        matchedKeywords: [navResult.label],
        requiresClaude: false,
        navigationTarget: navResult.path,
        action: { type: 'navigate', data: navResult.path, label: navResult.label },
      };
    }

    // Check for character switch
    if (/talk to (abe|tina)|switch to (abe|tina)|\u090F\u092C\u0947 \u0938\u0947 \u092C\u093E\u0924|\u091F\u0940\u0928\u093E \u0938\u0947 \u092C\u093E\u0924/i.test(lower)) {
      const char = lower.includes('tina') || lower.includes('\u091F\u0940\u0928\u093E') ? 'tina' : 'abe';
      return {
        intent: 'switch_character',
        confidence: 1.0,
        matchedKeywords: [`switch to ${char}`],
        requiresClaude: false,
        action: { type: 'navigate', data: char },
      };
    }

    // Check for action commands
    const actionResult = this.classifyAction(lower);
    if (actionResult) return actionResult;

    // Keyword-based intent matching
    let bestMatch: IntentResult | null = null;
    let bestScore = 0;

    for (const pattern of this.patterns) {
      let score = 0;
      const matched: string[] = [];

      for (const keyword of pattern.keywords) {
        if (lower.includes(keyword)) {
          score += keyword.length * pattern.priority;
          matched.push(keyword);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          intent: pattern.intent,
          confidence: Math.min(score / 30, 1.0),
          matchedKeywords: matched,
          requiresClaude: score < 15,
        };
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.3) {
      const complexIntents: IntentType[] = [
        'investment_start', 'compare_routes', 'risk', 'returns',
        'humor', 'philosophy', 'life_advice', 'general_knowledge',
        'distress',
      ];
      if (complexIntents.includes(bestMatch.intent)) {
        bestMatch.requiresClaude = true;
      }
      return bestMatch;
    }

    // No confident match - send to Claude
    return {
      intent: 'unknown',
      confidence: 0,
      matchedKeywords: [],
      requiresClaude: true,
    };
  }

  classifyNavigation(input: string): (NavigationTarget & { confidence: number }) | null {
    const lower = input.toLowerCase();

    // Direct page name matches (multilingual)
    for (const [key, target] of Object.entries(NAV_TARGETS)) {
      if (lower.includes(key)) {
        return { ...target, confidence: 0.9 };
      }
    }

    // Multilingual nav patterns
    for (const pattern of MULTILINGUAL_NAV_PATTERNS) {
      const match = lower.match(pattern);
      if (match) {
        const target = (match[1] || '').trim();
        for (const [key, nav] of Object.entries(NAV_TARGETS)) {
          if (target.includes(key) || key.includes(target)) {
            return { ...nav, confidence: 0.85 };
          }
        }
      }
    }

    return null;
  }

  private classifyAction(input: string): IntentResult | null {
    // Scroll commands (multilingual)
    if (/scroll\s*(up|top)|go\s*(to\s*)?top|back\s*to\s*top|\u090A\u092A\u0930\s*\u091C\u093E\u0913|\u0936\u0940\u0930\u094D\u0937|\u0BAE\u0BC7\u0BB2\u0BC7\s*\u0BAA\u0BCB|\u0C2A\u0C48\u0C15\u0C3F|\u0CAE\u0CC7\u0CB2\u0CC6|\u0D2E\u0D41\u0D15\u0D33\u0D3F\u0D32\u0D47\u0D15\u0D4D\u0D15\u0D4D/i.test(input)) {
      return { intent: 'scroll_top', confidence: 1.0, matchedKeywords: ['scroll up'], requiresClaude: false, action: { type: 'scroll', data: 'top' } };
    }
    if (/scroll\s*down|go\s*down|\u0928\u0940\u091A\u0947\s*\u091C\u093E\u0913|\u0906\u0917\u0947|\u0B95\u0BC0\u0BB4\u0BC7\s*\u0BAA\u0BCB|\u0C15\u0C3F\u0C02\u0C26\u0C15\u0C3F|\u0C95\u0CC6\u0CB3\u0C97\u0CC6|\u0D24\u0D3E\u0D34\u0D47\u0D15\u0D4D\u0D15\u0D4D/i.test(input)) {
      return { intent: 'scroll_down', confidence: 1.0, matchedKeywords: ['scroll down'], requiresClaude: false, action: { type: 'scroll', data: 'down' } };
    }

    // Theme toggle
    if (/dark\s*mode|light\s*mode|toggle\s*theme|night\s*mode|\u0921\u093E\u0930\u094D\u0915\s*\u092E\u094B\u0921|\u0925\u0940\u092E/i.test(input)) {
      return { intent: 'dark_mode', confidence: 1.0, matchedKeywords: ['dark mode'], requiresClaude: false, action: { type: 'theme' } };
    }

    // Contact actions
    if (/whatsapp|whats\s*app|\u0935\u0949\u091F\u094D\u0938\u090F\u092A|\u0BB5\u0BBE\u0B9F\u0BCD\u0BB8\u0BCD\u0B8F\u0BAA\u0BCD/i.test(input)) {
      return { intent: 'whatsapp', confidence: 1.0, matchedKeywords: ['whatsapp'], requiresClaude: false, action: { type: 'whatsapp' } };
    }
    if (/\bcall\b|phone|ring|dial|\u0915\u0949\u0932|\u092B\u094B\u0928|\u092C\u0941\u0932\u093E\u0913|\u0B85\u0BB4\u0BC8|\u0BAA\u0BCB\u0BA9\u0BCD|\u0C2B\u0C4B\u0C28\u0C4D|\u0CAB\u0CCB\u0CA8\u0CCD|\u0D2B\u0D4B\u0D23\u0D4D|\u0D35\u0D3F\u0D33\u0D3F\u0D15\u0D4D\u0D15\u0D42/i.test(input) && !/calculator|\u0915\u0948\u0932\u0915\u0941\u0932\u0947\u091F\u0930/i.test(input)) {
      return { intent: 'call', confidence: 0.9, matchedKeywords: ['call'], requiresClaude: false, action: { type: 'call' } };
    }
    if (/\bemail\b|send\s*email|\u0908\u092E\u0947\u0932|\u0BAE\u0BC6\u0BAF\u0BBF\u0BB2\u0BCD/i.test(input)) {
      return { intent: 'email', confidence: 0.9, matchedKeywords: ['email'], requiresClaude: false, action: { type: 'email' } };
    }

    // Tools
    if (/quiz|risk\s*assessment|\u0915\u094D\u0935\u093F\u091C\u093C|\u0B95\u0BC1\u0BB5\u0BBF\u0BB8\u0BCD|\u0BAA\u0BB0\u0BBF\u0B9F\u0BCD\u0B9A\u0BC8|\u0C15\u0C4D\u0C35\u0C3F\u0C1C\u0C4D|\u0C95\u0CCD\u0CB5\u0CBF\u0C9C\u0CCD|\u0D15\u0D4D\u0D35\u0D3F\u0D38\u0D4D/i.test(input)) {
      return { intent: 'quiz', confidence: 0.9, matchedKeywords: ['quiz'], requiresClaude: false, action: { type: 'quiz' } };
    }
    if (/calculator|calculate|sip\s*calc|\u0915\u0948\u0932\u0915\u0941\u0932\u0947\u091F\u0930|\u0917\u0923\u0928\u093E|\u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BBF|\u0C15\u0C4D\u0C2F\u0C3E\u0C32\u0C4D\u0C15\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D|\u0C95\u0CCD\u0CAF\u0CBE\u0CB2\u0CCD\u0C95\u0CC1\u0CB2\u0CC7\u0C9F\u0CB0\u0CCD/i.test(input)) {
      return { intent: 'calculator', confidence: 0.9, matchedKeywords: ['calculator'], requiresClaude: false, action: { type: 'calculator' } };
    }

    // Search
    if (/\bsearch\b|look\s*for|\u0916\u094B\u091C\u094B|\u0922\u0942\u0902\u0922\u094B|\u0BA4\u0BC7\u0B9F\u0BC1|\u0CB9\u0CC1\u0CA1\u0CC1\u0C95\u0CBF|\u0D24\u0D3F\u0D30\u0D2F\u0D42/i.test(input)) {
      return { intent: 'search', confidence: 0.8, matchedKeywords: ['search'], requiresClaude: false, action: { type: 'search' } };
    }

    // Stop speaking
    if (/\bstop\b|quiet|silence|mute|stop\s*talking|\u0930\u0941\u0915\u094B|\u091A\u0941\u092A|\u092C\u0902\u0926\s*\u0915\u0930\u094B|\u0BA8\u0BBF\u0BB1\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1|\u0C06\u0C2A\u0C41|\u0CA8\u0CBF\u0CB2\u0CCD\u0CB2\u0CBF\u0CB8\u0CBF|\u0D28\u0D3F\u0D7C\u0D24\u0D4D\u0D24\u0D42/i.test(input)) {
      return { intent: 'stop_speaking', confidence: 1.0, matchedKeywords: ['stop'], requiresClaude: false };
    }

    return null;
  }

  addPatterns(patterns: IntentPattern[]): void {
    this.patterns.push(...patterns);
  }

  getPatterns(): IntentPattern[] {
    return [...this.patterns];
  }

  findNavigationTarget(input: string): string | null {
    const result = this.classifyNavigation(input.toLowerCase());
    return result ? result.path : null;
  }

  private unknownResult(): IntentResult {
    return { intent: 'unknown', confidence: 0, matchedKeywords: [], requiresClaude: true };
  }
}
