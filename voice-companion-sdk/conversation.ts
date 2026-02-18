// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Conversation Manager
// Claude API integration, context, localStorage + IndexedDB
// ─────────────────────────────────────────────────────────────

import type {
  VoiceCompanionConfig, ChatMessage, ConversationContext,
  CharacterName, LangCode, EmotionType, UserPreferences,
  IntentType, Translations,
} from './types';
import { IntentClassifier } from './intent';
import { InvestmentKnowledge } from './investment';
import { EmotionEngine } from './emotional';
import { CharacterManager } from './characters';
import { LanguageManager } from './language';

const LS_SESSION = 'ghl-vc-session';
const LS_PREFS = 'ghl-vc-prefs';
const LS_VISITS = 'ghl-vc-visitcount';
const LS_LAST_VISIT = 'ghl-vc-lastvisit';
const DB_NAME = 'ghl-voice-companion';
const DB_VERSION = 1;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Conversation Manager ─────────────────────────────────────

export class ConversationManager {
  private config: Partial<VoiceCompanionConfig>;
  private context: ConversationContext;
  private messages: ChatMessage[] = [];
  private intentClassifier: IntentClassifier;
  private knowledge: InvestmentKnowledge;
  private emotionEngine: EmotionEngine;
  private characters: CharacterManager;
  private languageManager: LanguageManager;
  private listeners: Map<string, Set<Function>> = new Map();
  private db: IDBDatabase | null = null;
  private startTime = Date.now();

  constructor(
    config: Partial<VoiceCompanionConfig>,
    intentClassifier: IntentClassifier,
    knowledge: InvestmentKnowledge,
    emotionEngine: EmotionEngine,
    characters: CharacterManager,
    languageManager: LanguageManager,
  ) {
    this.config = config;
    this.intentClassifier = intentClassifier;
    this.knowledge = knowledge;
    this.emotionEngine = emotionEngine;
    this.characters = characters;
    this.languageManager = languageManager;

    this.context = this.createDefaultContext();
  }

  // ── Session Management ───────────────────────────────────

  async initSession(): Promise<ConversationContext> {
    // Load from localStorage
    const stored = this.loadFromLocalStorage();
    if (stored) {
      this.context = { ...this.context, ...stored };
    }

    // Track visits
    const visits = this.getVisitCount();
    this.context.visitCount = visits + 1;
    this.context.lastVisit = Date.now();
    this.persistVisitCount();

    // Init IndexedDB
    try {
      this.db = await this.openDatabase();
    } catch { /* IndexedDB not available, use localStorage only */ }

    return this.context;
  }

  getContext(): ConversationContext {
    this.context.timeOnSite = Math.floor((Date.now() - this.startTime) / 1000);
    return { ...this.context };
  }

  updateContext(partial: Partial<ConversationContext>): void {
    Object.assign(this.context, partial);
    this.saveToLocalStorage();
    this.emit('contextUpdated', this.context);
  }

  resetSession(): void {
    this.context = this.createDefaultContext();
    this.messages = [];
    this.saveToLocalStorage();
  }

  // ── Message Management ───────────────────────────────────

  addMessage(msg: ChatMessage): void {
    this.messages.push(msg);
    this.context.messageCount++;

    if (msg.speaker === 'user') {
      this.context.questionsAsked.push(msg.text);
      if (this.context.questionsAsked.length > 20) {
        this.context.questionsAsked = this.context.questionsAsked.slice(-20);
      }
    }

    // Persist to IndexedDB periodically
    if (this.messages.length % 5 === 0) {
      this.saveToIndexedDB().catch(() => {});
    }

    this.saveToLocalStorage();
    this.emit('messageAdded', msg);
  }

  getMessages(limit?: number): ChatMessage[] {
    if (!limit) return [...this.messages];
    return this.messages.slice(-limit);
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  // ── Claude AI Integration ────────────────────────────────

  async generateResponse(
    input: string,
    onChunk?: (text: string) => void
  ): Promise<ChatMessage[]> {
    // 1. Classify intent
    const intentResult = this.intentClassifier.classify(input, this.context);

    // 2. Detect emotion
    const emotion = this.emotionEngine.detect(input, this.context);
    this.context.emotionalState = emotion.emotion;

    // 3. Select speaker
    const speaker = this.characters.selectSpeaker(intentResult.intent, emotion.emotion);
    this.context.activeCharacter = speaker;

    // 4. Handle direct actions (no Claude needed)
    if (!intentResult.requiresClaude && intentResult.action) {
      return this.handleDirectAction(intentResult.intent, input, speaker, intentResult);
    }

    // 5. Try Claude API
    if (this.config.enableClaudeAI !== false && this.config.claudeApiKey) {
      try {
        return await this.callClaude(input, speaker, emotion.emotion, intentResult.intent, onChunk);
      } catch (err) {
        // Fall through to keyword fallback
        console.warn('Claude API error, falling back to keywords:', err);
      }
    }

    // 6. Keyword fallback
    return this.generateKeywordResponse(input, speaker, intentResult.intent);
  }

  private async callClaude(
    input: string,
    speaker: CharacterName,
    emotion: EmotionType,
    intent: IntentType,
    onChunk?: (text: string) => void,
  ): Promise<ChatMessage[]> {
    const character = this.characters.getCharacter(speaker);
    const modifier = this.characters.getPersonalityModifier(speaker, emotion);
    const knowledgeContext = this.knowledge.buildSystemPromptContext();

    const systemPrompt = `${character.systemPromptFragment}

${modifier.tonePrefix}

${knowledgeContext}

CONVERSATION CONTEXT:
- Visitor name: ${this.context.visitorName || 'Guest'}
- Language: ${this.context.language}
- Current page: ${this.context.currentPage || '/'}
- Visit count: ${this.context.visitCount}
- Detected emotion: ${emotion}
- Previous topics: ${this.context.topicStack.slice(-3).join(', ') || 'none'}

RULES:
- Respond in ${this.context.language === 'en' ? 'English' : `the language with code "${this.context.language}"`}
- Keep responses under 3 sentences for voice (expand only if user asks for detail)
- Use natural spoken language - no bullet points, no markdown, no asterisks
- Be emotionally aware based on the detected emotion
- If you can't answer something, offer to connect with the human team
- Never fabricate specific numbers not in the knowledge base
- Include SEBI disclaimer context when discussing returns/risk`;

    // Build message history (last 10 turns)
    const history = this.messages.slice(-10).map(m => ({
      role: m.speaker === 'user' ? 'user' as const : 'assistant' as const,
      content: m.speaker === 'user' ? m.text : `[${m.speaker}]: ${m.text}`,
    }));

    // Add current user message
    history.push({ role: 'user' as const, content: input });

    const url = this.config.claudeProxyUrl || 'https://api.anthropic.com/v1/messages';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };

    if (!this.config.claudeProxyUrl) {
      headers['x-api-key'] = this.config.claudeApiKey!;
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const body = {
      model: this.config.claudeModel || 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      stream: !!onChunk,
      system: systemPrompt,
      messages: history,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    // Streaming response
    if (onChunk && response.body) {
      return this.handleStreamingResponse(response, speaker, intent, onChunk);
    }

    // Non-streaming response
    const data = await response.json();
    const text = data.content?.[0]?.text || 'I\'m not sure how to respond to that. Would you like to speak with our team?';

    const msg: ChatMessage = {
      id: generateId(),
      speaker,
      text,
      timestamp: Date.now(),
      intent,
      emotion: this.context.emotionalState,
    };

    // Update topic stack
    if (intent !== 'unknown' && intent !== 'greeting') {
      this.context.topicStack.push(intent);
      if (this.context.topicStack.length > 5) this.context.topicStack.shift();
    }

    return [msg];
  }

  private async handleStreamingResponse(
    response: Response,
    speaker: CharacterName,
    intent: IntentType,
    onChunk: (text: string) => void,
  ): Promise<ChatMessage[]> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullText += parsed.delta.text;
                onChunk(fullText);
              }
            } catch { /* skip invalid JSON lines */ }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!fullText) {
      fullText = 'I\'m here to help. Could you rephrase that?';
    }

    const msg: ChatMessage = {
      id: generateId(),
      speaker,
      text: fullText,
      timestamp: Date.now(),
      intent,
      emotion: this.context.emotionalState,
    };

    if (intent !== 'unknown' && intent !== 'greeting') {
      this.context.topicStack.push(intent);
      if (this.context.topicStack.length > 5) this.context.topicStack.shift();
    }

    return [msg];
  }

  // ── Translation Helper ───────────────────────────────────

  private t(): Translations {
    return this.languageManager.getTranslations();
  }

  // ── Direct Actions ───────────────────────────────────────

  private handleDirectAction(
    intent: IntentType,
    input: string,
    speaker: CharacterName,
    intentResult: { action?: { type: string; data?: string } },
  ): ChatMessage[] {
    const action = intentResult.action;
    const messages: ChatMessage[] = [];
    const tr = this.t();

    switch (intent) {
      case 'navigate': {
        const path = action?.data || '/';
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.navigatingTo,
          timestamp: Date.now(), intent, actions: [{ type: 'navigate', data: path }],
        });
        break;
      }
      case 'whatsapp':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.openingWhatsApp,
          timestamp: Date.now(), intent, actions: [{ type: 'whatsapp' }],
        });
        break;
      case 'call':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.connectingCall,
          timestamp: Date.now(), intent, actions: [{ type: 'call' }],
        });
        break;
      case 'email':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.openingEmail,
          timestamp: Date.now(), intent, actions: [{ type: 'email' }],
        });
        break;
      case 'quiz':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.openingQuiz,
          timestamp: Date.now(), intent, actions: [{ type: 'quiz' }],
        });
        break;
      case 'calculator':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.openingCalculator,
          timestamp: Date.now(), intent, actions: [{ type: 'calculator' }],
        });
        break;
      case 'scroll_top':
        messages.push({
          id: generateId(), speaker, text: tr.scrollingTop,
          timestamp: Date.now(), intent, actions: [{ type: 'scroll', data: 'top' }],
        });
        break;
      case 'scroll_down':
        messages.push({
          id: generateId(), speaker, text: tr.scrollingDown,
          timestamp: Date.now(), intent, actions: [{ type: 'scroll', data: 'down' }],
        });
        break;
      case 'dark_mode':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.togglingTheme,
          timestamp: Date.now(), intent, actions: [{ type: 'theme' }],
        });
        break;
      case 'search':
        messages.push({
          id: generateId(), speaker: 'tina', text: tr.openingSearch,
          timestamp: Date.now(), intent, actions: [{ type: 'search' }],
        });
        break;
      case 'stop_speaking':
        messages.push({
          id: generateId(), speaker, text: tr.stoppedSpeaking,
          timestamp: Date.now(), intent,
        });
        break;
      default:
        return this.generateKeywordResponse(input, speaker, intent);
    }

    return messages;
  }

  // ── Keyword Fallback ─────────────────────────────────────

  generateKeywordResponse(input: string, speaker: CharacterName, intent: IntentType): ChatMessage[] {
    const tr = this.t();

    // Try knowledge base
    const knowledgeResult = this.knowledge.findResponse(input);
    if (knowledgeResult) {
      const entry = knowledgeResult.entry;
      return [{
        id: generateId(),
        speaker: entry.speaker || speaker,
        text: entry.response,
        timestamp: Date.now(),
        intent,
        actions: entry.actions,
      }];
    }

    // Intent-specific fallbacks (using translations for multilingual support)
    const fallbacks: Partial<Record<IntentType, { speaker: CharacterName; text: string }>> = {
      greeting: { speaker: 'abe', text: tr.greetingFallback },
      thanks: { speaker: 'tina', text: tr.thanksFallback },
      goodbye: { speaker: 'abe', text: tr.goodbyeFallback },
      human: { speaker: 'tina', text: tr.humanFallback },
      humor: { speaker: 'tina', text: tr.humorFallback },
      help: { speaker: 'tina', text: tr.helpFallback },
      distress: { speaker: 'abe', text: tr.distressFallback },
      start_over: { speaker: 'tina', text: tr.startOverFallback },
    };

    const fallback = fallbacks[intent];
    if (fallback) {
      return [{ id: generateId(), speaker: fallback.speaker, text: fallback.text, timestamp: Date.now(), intent }];
    }

    // Generic fallback
    return [{
      id: generateId(),
      speaker: 'abe',
      text: tr.genericFallback,
      timestamp: Date.now(),
      intent: 'unknown',
    }];
  }

  // ── Visitor Tracking ─────────────────────────────────────

  setVisitorName(name: string): void {
    this.context.visitorName = name;
    this.saveToLocalStorage();
  }

  getVisitorName(): string | undefined {
    return this.context.visitorName;
  }

  getVisitCount(): number {
    if (typeof localStorage === 'undefined') return 0;
    return parseInt(localStorage.getItem(LS_VISITS) || '0', 10);
  }

  isReturningVisitor(): boolean {
    return this.getVisitCount() > 1;
  }

  // ── Persistence: localStorage ────────────────────────────

  saveToLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const session = {
        sessionId: this.context.sessionId,
        visitorName: this.context.visitorName,
        language: this.context.language,
        activeCharacter: this.context.activeCharacter,
        topicStack: this.context.topicStack,
        preferences: this.context.preferences,
        currentPage: this.context.currentPage,
      };
      localStorage.setItem(LS_SESSION, JSON.stringify(session));
    } catch { /* quota exceeded */ }
  }

  loadFromLocalStorage(): Partial<ConversationContext> | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LS_SESSION);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  private persistVisitCount(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LS_VISITS, String(this.context.visitCount));
    localStorage.setItem(LS_LAST_VISIT, String(Date.now()));
  }

  // ── Persistence: IndexedDB ───────────────────────────────

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB not available')); return; }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('conversations')) {
          const store = db.createObjectStore('conversations', { keyPath: 'sessionId' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveToIndexedDB(): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('conversations', 'readwrite');
      const store = tx.objectStore('conversations');
      store.put({
        sessionId: this.context.sessionId,
        messages: this.messages.slice(-50),
        context: this.context,
        timestamp: Date.now(),
      });
    } catch { /* ignore */ }
  }

  async loadFromIndexedDB(sessionId?: string): Promise<ChatMessage[]> {
    if (!this.db) return [];
    const id = sessionId || this.context.sessionId;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('conversations', 'readonly');
        const store = tx.objectStore('conversations');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result?.messages || []);
        request.onerror = () => resolve([]);
      } catch { resolve([]); }
    });
  }

  async clearHistory(): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').clear();
    } catch { /* ignore */ }
  }

  // ── Events ───────────────────────────────────────────────

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  // ── Internals ────────────────────────────────────────────

  private createDefaultContext(): ConversationContext {
    return {
      sessionId: generateId(),
      language: 'en',
      activeCharacter: this.config.defaultCharacter || 'abe',
      messageCount: 0,
      topicStack: [],
      emotionalState: 'neutral',
      visitCount: 0,
      currentPage: '/',
      pagesVisited: [],
      questionsAsked: [],
      timeOnSite: 0,
      preferences: {
        ttsEnabled: this.config.enableTts !== false,
        voiceInputEnabled: this.config.enableVoice !== false,
        reducedMotion: typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      },
    };
  }

  destroy(): void {
    this.saveToLocalStorage();
    this.saveToIndexedDB().catch(() => {});
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.listeners.clear();
  }
}
