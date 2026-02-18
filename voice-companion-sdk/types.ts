// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Type Definitions
// GHL India Ventures | Abe & Tina
// ─────────────────────────────────────────────────────────────

// ── Language ──────────────────────────────────────────────────

export type LangCode =
  | 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml'
  | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja' | 'pt' | 'ru';

export interface LanguageOption {
  code: LangCode;
  name: string;
  native: string;
  flag: string;
  rtl?: boolean;
  voiceLang: string;
}

export interface Translations {
  greeting_morning: string;
  greeting_afternoon: string;
  greeting_evening: string;
  greeting_night: string;
  welcome: string;
  welcomeBack: string;
  dismiss: string;
  capabilities_intro: string;
  capabilities: string[];
  quickActions: { label: string; action: string }[];
  listening: string;
  thinking: string;
  inputPlaceholder: string;
  ttsLabel: string;
  langLabel: string;
  closeLabel: string;
  minimizeLabel: string;
  micPermissionDenied: string;
  disclaimer: string;
  privacyLink: string;
  switchCharacter: string;
  enableVoice: string;
  detectingLanguage: string;
  chooseLanguage: string;
  voiceNotSupported: string;
  textFallback: string;
  connectionSlow: string;
  welcomeBackMessage: string;
  helpRequest: string;

  // Action response strings (for multilingual direct actions)
  navigatingTo: string;
  openingWhatsApp: string;
  connectingCall: string;
  openingEmail: string;
  openingQuiz: string;
  openingCalculator: string;
  scrollingTop: string;
  scrollingDown: string;
  togglingTheme: string;
  openingSearch: string;
  stoppedSpeaking: string;
  tinaIntro: string;

  // Fallback response strings
  greetingFallback: string;
  thanksFallback: string;
  goodbyeFallback: string;
  humanFallback: string;
  humorFallback: string;
  helpFallback: string;
  distressFallback: string;
  startOverFallback: string;
  genericFallback: string;
}

// ── Characters ───────────────────────────────────────────────

export type CharacterName = 'abe' | 'tina';

export type AnimationState =
  | 'idle' | 'speaking' | 'listening'
  | 'waving' | 'thinking' | 'celebrating';

export type PersonalityTrait =
  | 'calm' | 'professional' | 'empathetic'
  | 'enthusiastic' | 'reassuring' | 'humorous';

export interface VoiceConfig {
  pitch: number;
  rate: number;
  volume: number;
  preferredVoiceNames: string[];
}

export interface Character {
  name: CharacterName;
  displayName: string;
  role: string;
  personality: PersonalityTrait[];
  voiceConfig: VoiceConfig;
  accentColor: string;
  systemPromptFragment: string;
}

export interface PersonalityModifier {
  tonePrefix: string;
  rateAdjust: number;
  pitchAdjust: number;
}

// ── Emotions ─────────────────────────────────────────────────

export type EmotionType =
  | 'neutral' | 'happy' | 'curious' | 'confused'
  | 'frustrated' | 'anxious' | 'excited' | 'grateful';

export interface EmotionSignal {
  emotion: EmotionType;
  confidence: number;
  indicators: string[];
}

// ── Intent ───────────────────────────────────────────────────

export type IntentType =
  | 'greeting' | 'thanks' | 'goodbye'
  | 'about_company' | 'about_fund' | 'about_sebi' | 'about_team'
  | 'investment_start' | 'minimum_investment' | 'returns' | 'risk'
  | 'real_estate' | 'startups' | 'portfolio' | 'debenture' | 'direct_aif'
  | 'nri' | 'tax' | 'kyc' | 'documents' | 'compare_routes'
  | 'navigate' | 'contact' | 'whatsapp' | 'call' | 'email' | 'human'
  | 'blog' | 'read_page' | 'quiz' | 'calculator'
  | 'confidential' | 'distress' | 'name_response'
  | 'fd_comparison' | 'eligibility' | 'tenure' | 'exit_mechanism' | 'reporting'
  | 'complaint' | 'ppm'
  | 'scroll_top' | 'scroll_down' | 'dark_mode' | 'search'
  | 'switch_character' | 'change_language' | 'repeat_last' | 'stop_speaking'
  | 'humor' | 'philosophy' | 'life_advice' | 'general_knowledge'
  | 'slow_down' | 'start_over' | 'help'
  | 'unknown';

export type ActionType =
  | 'navigate' | 'quiz' | 'calculator'
  | 'whatsapp' | 'call' | 'email' | 'form'
  | 'scroll' | 'theme' | 'search' | 'external_link';

export interface MessageAction {
  type: ActionType;
  data?: string;
  label?: string;
}

export interface IntentPattern {
  intent: IntentType;
  keywords: string[];
  priority: number;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  matchedKeywords: string[];
  requiresClaude: boolean;
  navigationTarget?: string;
  action?: MessageAction;
}

export interface NavigationTarget {
  path: string;
  label: string;
}

// ── Conversation ─────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  speaker: CharacterName | 'user' | 'system';
  text: string;
  timestamp: number;
  intent?: IntentType;
  emotion?: EmotionType;
  actions?: MessageAction[];
}

export interface ConversationContext {
  sessionId: string;
  visitorName?: string;
  language: LangCode;
  activeCharacter: CharacterName;
  messageCount: number;
  lastIntent?: IntentType;
  topicStack: string[];
  emotionalState: EmotionType;
  visitCount: number;
  lastVisit?: number;
  currentPage: string;
  pagesVisited: string[];
  questionsAsked: string[];
  timeOnSite: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  ttsEnabled: boolean;
  voiceInputEnabled: boolean;
  preferredCharacter?: CharacterName;
  investmentInterest?: 'aif' | 'debenture' | 'both' | 'unknown';
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  reducedMotion: boolean;
}

// ── Speech ───────────────────────────────────────────────────

export interface SpeechCapabilities {
  ttsSupported: boolean;
  sttSupported: boolean;
  nativeVoiceCount: number;
  preferredProvider: 'native' | 'elevenlabs' | 'google';
  isMobile: boolean;
  browserName: string;
}

export interface TTSRequest {
  text: string;
  language: LangCode;
  character: CharacterName;
  emotion?: EmotionType;
  rate?: number;
  pitch?: number;
}

export type TTSProvider = 'native' | 'elevenlabs' | 'google' | 'auto';

// ── Knowledge ────────────────────────────────────────────────

export interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  response: string;
  followUp: string[];
  priority: number;
  speaker?: CharacterName;
  actions?: MessageAction[];
}

export interface BrandData {
  name: string;
  tagline: string;
  sebiRegistration: string;
  phone: string;
  altPhone: string;
  email: string;
  whatsapp: string;
  address: string;
  officeHours: string;
  minInvestmentAIF: string;
  minInvestmentDebenture: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export interface PortfolioCompany {
  name: string;
  sector: string;
  description: string;
  year: number;
}

// ── UI ───────────────────────────────────────────────────────

export type UIPhase =
  | 'hidden' | 'greeting' | 'langPick'
  | 'capabilities' | 'chat' | 'minimized';

export interface UIState {
  phase: UIPhase;
  activeCharacter: CharacterName;
  abeAnim: AnimationState;
  tinaAnim: AnimationState;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  showLangPicker: boolean;
  transcript: string;
  ttsEnabled: boolean;
}

// ── Plugin System ────────────────────────────────────────────

export interface VoiceCompanionPlugin {
  name: string;
  version: string;
  init: (api: VoiceCompanionAPI) => void;
  destroy?: () => void;
  handleIntent?: (intent: IntentType, input: string) => ChatMessage[] | null;
  handleAction?: (action: ActionType, data?: string) => boolean;
}

// ── SDK Configuration ────────────────────────────────────────

export interface VoiceCompanionConfig {
  containerId?: string;
  claudeApiKey?: string;
  claudeModel?: string;
  claudeProxyUrl?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoices?: { abe: string; tina: string };
  googleCloudTtsKey?: string;
  ttsProvider?: TTSProvider;
  defaultCharacter?: CharacterName;
  language?: LangCode;
  theme?: 'dark' | 'light' | 'auto';
  position?: 'bottom-right' | 'bottom-left';
  autoGreet?: boolean;
  autoGreetDelay?: number;
  enableVoice?: boolean;
  enableTts?: boolean;
  enableClaudeAI?: boolean;
  mobileMode?: 'push-to-talk' | 'continuous';
  navigationHandler?: (path: string) => void;
  actionHandler?: (action: ActionType, data?: string) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
  knowledgeBase?: KnowledgeEntry[];
  brandData?: Partial<BrandData>;
}

// ── Public API ───────────────────────────────────────────────

export interface VoiceCompanionAPI {
  show(): void;
  hide(): void;
  minimize(): void;
  setLanguage(lang: LangCode): void;
  setCharacter(name: CharacterName): void;
  sendMessage(text: string): void;
  speak(text: string, character?: CharacterName): void;
  stopSpeaking(): void;
  startListening(): void;
  stopListening(): void;
  navigateTo(path: string): void;
  getContext(): ConversationContext;
  registerPlugin(plugin: VoiceCompanionPlugin): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  destroy(): void;
}

// ── Event Emitter ────────────────────────────────────────────

export type SDKEvent =
  | 'ready' | 'error'
  | 'messageAdded' | 'phaseChanged' | 'languageChanged'
  | 'characterChanged' | 'emotionDetected'
  | 'speakStart' | 'speakEnd'
  | 'listenStart' | 'listenEnd'
  | 'intentClassified' | 'navigationTriggered';
