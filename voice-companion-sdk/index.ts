// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Main Entry Point
// GHL India Ventures | Abe & Tina
// Orchestrates all modules into a unified VoiceCompanion
// ─────────────────────────────────────────────────────────────

import type {
  VoiceCompanionConfig, VoiceCompanionAPI, VoiceCompanionPlugin,
  LangCode, CharacterName, ChatMessage, ConversationContext,
  UIPhase, SDKEvent, ActionType, IntentType,
} from './types';
import { SpeechEngine } from './speech';
import { LanguageManager, LANGUAGES } from './language';
import { CharacterManager } from './characters';
import { IntentClassifier } from './intent';
import { ConversationManager } from './conversation';
import { InvestmentKnowledge } from './investment';
import { EmotionEngine } from './emotional';
import { UIManager } from './ui';
import { OnboardingManager } from './onboarding';

// ── Event Emitter ───────────────────────────────────────────

type EventHandler = (...args: unknown[]) => void;

class EventEmitter {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach(h => {
      try { h(...args); } catch (e) { console.error(`[VoiceCompanion] Event handler error:`, e); }
    });
  }
}

// ── Plugin Manager ──────────────────────────────────────────

class PluginManager {
  private plugins = new Map<string, VoiceCompanionPlugin>();

  register(plugin: VoiceCompanionPlugin, api: VoiceCompanionAPI): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[VoiceCompanion] Plugin "${plugin.name}" already registered`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
    plugin.init(api);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy?.();
      this.plugins.delete(name);
    }
  }

  handleIntent(intent: IntentType, input: string): ChatMessage[] | null {
    const plugins = Array.from(this.plugins.values());
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      if (plugin.handleIntent) {
        const result = plugin.handleIntent(intent, input);
        if (result) return result;
      }
    }
    return null;
  }

  handleAction(action: ActionType, data?: string): boolean {
    const plugins = Array.from(this.plugins.values());
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      if (plugin.handleAction) {
        if (plugin.handleAction(action, data)) return true;
      }
    }
    return false;
  }

  destroyAll(): void {
    this.plugins.forEach(p => p.destroy?.());
    this.plugins.clear();
  }
}

// ── Main VoiceCompanion Class ───────────────────────────────

export class VoiceCompanion implements VoiceCompanionAPI {
  private config: VoiceCompanionConfig;
  private events = new EventEmitter();
  private pluginMgr = new PluginManager();

  private speech!: SpeechEngine;
  private language!: LanguageManager;
  private characters!: CharacterManager;
  private intentClassifier!: IntentClassifier;
  private conversation!: ConversationManager;
  private knowledge!: InvestmentKnowledge;
  private emotion!: EmotionEngine;
  private ui!: UIManager;
  private onboarding!: OnboardingManager;

  private currentLang: LangCode;
  private currentCharacter: CharacterName;
  private isSpeaking = false;
  private isListening = false;

  private constructor(config: VoiceCompanionConfig) {
    this.config = config;
    this.currentLang = config.language || 'en';
    this.currentCharacter = config.defaultCharacter || 'abe';
  }

  // ── Factory ───────────────────────────────────────────────

  static async create(config: VoiceCompanionConfig): Promise<VoiceCompanion> {
    const instance = new VoiceCompanion(config);
    await instance.initialize();
    return instance;
  }

  // ── Initialization ────────────────────────────────────────

  private async initialize(): Promise<void> {
    try {
      // 1. Language manager (no constructor args)
      this.language = new LanguageManager();

      // 2. Detect language if not specified
      if (!this.config.language) {
        const detected = await this.language.detectLanguage();
        this.currentLang = detected;
      } else {
        this.language.setLanguage(this.currentLang);
      }

      // 3. Character manager (no constructor args)
      this.characters = new CharacterManager();

      // 4. Speech engine (takes Partial<VoiceCompanionConfig>)
      this.speech = new SpeechEngine({
        ttsProvider: this.config.ttsProvider,
        elevenLabsApiKey: this.config.elevenLabsApiKey,
        elevenLabsVoices: this.config.elevenLabsVoices,
        googleCloudTtsKey: this.config.googleCloudTtsKey,
      });

      // Wire speech events
      this.speech.on('speakStart', () => {
        this.isSpeaking = true;
        this.ui.setSpeaking(true);
        this.characters.setAnimation(this.currentCharacter, 'speaking');
        this.events.emit('speakStart');
      });
      this.speech.on('speakEnd', () => {
        this.isSpeaking = false;
        this.ui.setSpeaking(false);
        this.characters.setAnimation(this.currentCharacter, 'idle');
        this.events.emit('speakEnd');
      });
      this.speech.on('listenStart', () => {
        this.isListening = true;
        this.ui.setListening(true);
        this.characters.setAnimation(this.currentCharacter, 'listening');
        this.events.emit('listenStart');
      });
      this.speech.on('listenEnd', () => {
        this.isListening = false;
        this.ui.setListening(false);
        this.characters.setAnimation(this.currentCharacter, 'idle');
        this.events.emit('listenEnd');
      });

      // 5. Intent classifier (optional knowledgeBase)
      this.intentClassifier = new IntentClassifier(this.config.knowledgeBase);

      // 6. Investment knowledge
      this.knowledge = new InvestmentKnowledge();

      // 7. Emotion engine (no constructor args)
      this.emotion = new EmotionEngine();

      // 8. Conversation manager (config, intentClassifier, knowledge, emotion, characters, language)
      this.conversation = new ConversationManager(
        this.config,
        this.intentClassifier,
        this.knowledge,
        this.emotion,
        this.characters,
        this.language,
      );
      await this.conversation.initSession();

      // 9. UI Manager
      this.ui = new UIManager({
        callbacks: {
          onSendMessage: (text) => this.processUserInput(text),
          onMicToggle: () => this.toggleListening(),
          onTtsToggle: () => this.toggleTts(),
          onLanguageSelect: (lang) => {
            this.setLanguage(lang);
            this.onboarding.onLanguageSelected();
          },
          onCharacterSwitch: () => this.switchCharacter(),
          onGreetingAccept: () => this.onboarding.onGreetingAccept(),
          onGreetingDismiss: () => this.onboarding.onGreetingDismiss(),
          onCapabilitiesDone: () => this.onboarding.onCapabilitiesDone(),
          onMinimize: () => this.onboarding.onMinimize(),
          onClose: () => this.onboarding.onClose(),
          onQuickAction: (action) => this.handleQuickAction(action),
          onFabClick: () => this.onboarding.onFabClick(),
          onSummaryRequest: () => this.generateSummary(),
          onClearChat: () => this.conversation.resetSession(),
        },
        position: this.config.position || 'bottom-right',
        theme: this.config.theme || 'dark',
        getAvatarSVG: (name) => this.characters.getAvatarSVG(name),
        getMiniAvatarSVG: (name) => this.characters.getMiniAvatarSVG(name),
        getTranslations: () => this.language.getTranslations(),
        getLanguages: () => LANGUAGES,
        currentLang: this.currentLang,
      });

      this.ui.init(this.config.containerId);

      // 10. Onboarding manager
      this.onboarding = new OnboardingManager({
        callbacks: {
          onPhaseChange: (phase) => this.handlePhaseChange(phase),
          onShowToast: (msg) => this.ui.showToast(msg),
          onLanguageDetected: (lang) => this.setLanguage(lang),
        },
        autoGreet: this.config.autoGreet !== false,
        autoGreetDelay: this.config.autoGreetDelay ?? 2500,
      });

      // 11. Set initial TTS state
      this.ui.setTtsEnabled(this.config.enableTts !== false);

      // 12. Start onboarding
      this.onboarding.start();

      // 13. Notify ready
      this.events.emit('ready');
      this.config.onReady?.();

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[VoiceCompanion] Initialization error:', err);
      this.events.emit('error', err);
      this.config.onError?.(err);
    }
  }

  // ── Core Message Processing Pipeline ──────────────────────

  private async processUserInput(text: string): Promise<void> {
    // 1. Add user message to UI
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text,
      timestamp: Date.now(),
    };
    this.ui.addMessage(userMsg);
    this.events.emit('messageAdded', userMsg);

    // 2. Detect emotion
    const emotionSignal = this.emotion.detect(text);
    this.events.emit('emotionDetected', emotionSignal);

    // 3. Classify intent
    const ctx = this.conversation.getContext();
    const intentResult = this.intentClassifier.classify(text, ctx);
    this.events.emit('intentClassified', intentResult);

    // 4. Check plugins
    const pluginResponse = this.pluginMgr.handleIntent(intentResult.intent, text);
    if (pluginResponse) {
      for (const msg of pluginResponse) {
        this.deliverBotMessage(msg);
      }
      return;
    }

    // 5. Handle navigation fast-path
    if (intentResult.navigationTarget) {
      this.navigateTo(intentResult.navigationTarget);
      const speaker = this.characters.selectSpeaker(intentResult.intent, emotionSignal.emotion);
      const t = this.language.getTranslations();
      const navMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        speaker,
        text: t.navigatingTo,
        timestamp: Date.now(),
        intent: intentResult.intent,
      };
      this.deliverBotMessage(navMsg);
      return;
    }

    // 6. Handle direct actions
    if (intentResult.action) {
      this.handleAction(intentResult.action.type, intentResult.action.data);
      return;
    }

    // 7. Show thinking indicator
    this.ui.setThinking(true);
    this.characters.setAnimation(this.currentCharacter, 'thinking');

    // 8. Generate response via ConversationManager
    try {
      const responseMessages = await this.conversation.generateResponse(text);

      this.ui.setThinking(false);
      this.characters.setAnimation(this.currentCharacter, 'idle');

      for (const msg of responseMessages) {
        this.deliverBotMessage(msg);
      }

      // Check for emotional escalation
      if (this.emotion.shouldEscalateToHuman(emotionSignal.emotion, ctx)) {
        setTimeout(() => {
          const escalateMsg: ChatMessage = {
            id: `system-${Date.now()}`,
            speaker: 'system',
            text: 'It seems like you might benefit from speaking with a human advisor. Would you like me to connect you?',
            timestamp: Date.now(),
            actions: [
              { type: 'call', label: 'Call Now' },
              { type: 'whatsapp', label: 'WhatsApp' },
              { type: 'email', label: 'Email' },
            ],
          };
          this.deliverBotMessage(escalateMsg);
        }, 1000);
      }

    } catch (error) {
      this.ui.setThinking(false);
      this.characters.setAnimation(this.currentCharacter, 'idle');
      console.error('[VoiceCompanion] Response error:', error);

      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        speaker: this.currentCharacter,
        text: 'I apologize, I encountered an issue. Could you try rephrasing your question?',
        timestamp: Date.now(),
      };
      this.deliverBotMessage(errorMsg);
    }
  }

  private deliverBotMessage(msg: ChatMessage): void {
    const avatarSVG = msg.speaker !== 'user' && msg.speaker !== 'system'
      ? this.characters.getMiniAvatarSVG(msg.speaker as CharacterName)
      : undefined;

    this.ui.addMessage(msg, avatarSVG);
    this.events.emit('messageAdded', msg);

    // Update active character display
    if (msg.speaker !== 'user' && msg.speaker !== 'system') {
      this.currentCharacter = msg.speaker as CharacterName;
      this.ui.setActiveCharacter(this.currentCharacter);
    }

    // Speak the response if TTS is enabled
    if (this.config.enableTts !== false && msg.speaker !== 'user' && msg.speaker !== 'system') {
      const char = this.characters.getCharacter(msg.speaker as CharacterName);
      const voiceConfig = this.emotion.adjustVoiceParams(char.voiceConfig, msg.emotion || 'neutral');
      this.speech.speak({
        text: msg.text,
        language: this.currentLang,
        character: msg.speaker as CharacterName,
        emotion: msg.emotion,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
      });
    }
  }

  // ── Action Handling ───────────────────────────────────────

  private handleAction(type: ActionType, data?: string): void {
    if (this.pluginMgr.handleAction(type, data)) return;

    if (this.config.actionHandler) {
      this.config.actionHandler(type, data);
      return;
    }

    switch (type) {
      case 'whatsapp':
        window.open('https://wa.me/917200255252', '_blank');
        break;
      case 'call':
        window.open('tel:+917200255252', '_self');
        break;
      case 'email':
        window.open('mailto:info@ghlindia.com', '_self');
        break;
      case 'scroll':
        if (data === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (data === 'down') window.scrollBy({ top: 400, behavior: 'smooth' });
        break;
      case 'theme':
        document.documentElement.classList.toggle('dark');
        break;
      case 'navigate':
        if (data) this.navigateTo(data);
        break;
      case 'external_link':
        if (data) window.open(data, '_blank');
        break;
      default:
        break;
    }
  }

  private handleQuickAction(action: string): void {
    if (action.includes(':')) {
      const [type, data] = action.split(':', 2);
      this.handleAction(type as ActionType, data);
    } else {
      this.processUserInput(action);
    }
  }

  // ── Phase Management ──────────────────────────────────────

  private chatWelcomeSent = false;

  private handlePhaseChange(phase: UIPhase): void {
    this.ui.setPhase(phase);
    this.events.emit('phaseChanged', phase);

    // Auto-send welcome message when entering chat for the first time
    if (phase === 'chat' && !this.chatWelcomeSent) {
      this.chatWelcomeSent = true;
      setTimeout(() => this.sendWelcomeMessage(), 400);
    }
  }

  private sendWelcomeMessage(): void {
    const t = this.language.getTranslations();
    const welcomeMsg: ChatMessage = {
      id: `bot-welcome-${Date.now()}`,
      speaker: 'abe',
      text: t.welcome || "Welcome! I'm Abe, your investment advisor. Ask me anything about GHL India Ventures, or use the mic to speak. Tina and I are here to help!",
      timestamp: Date.now(),
      intent: 'greeting',
    };
    this.deliverBotMessage(welcomeMsg);

    // Follow up with Tina after a short delay
    setTimeout(() => {
      const t2 = this.language.getTranslations();
      const tinaMsg: ChatMessage = {
        id: `bot-tina-intro-${Date.now()}`,
        speaker: 'tina',
        text: t2.tinaIntro || "Hi there! Try clicking the mic button to talk to us, or use the quick actions below. I'm here to help you navigate and explore!",
        timestamp: Date.now(),
        intent: 'greeting',
      };
      this.deliverBotMessage(tinaMsg);
    }, 1500);
  }

  // ── Conversation Summary ─────────────────────────────────

  private generateSummary(): string {
    const messages = this.conversation.getMessages();
    if (messages.length === 0) return '';

    const userMsgs = messages.filter(m => m.speaker === 'user');
    const botMsgs = messages.filter(m => m.speaker !== 'user' && m.speaker !== 'system');
    const ctx = this.conversation.getContext();

    const topics = ctx.topicStack.length > 0
      ? ctx.topicStack.slice(-5).join(', ')
      : 'general inquiry';

    const duration = Math.floor((Date.now() - (ctx.lastVisit || Date.now())) / 60000);
    const durationStr = duration > 0 ? `${duration} min` : 'just now';

    return `Session Summary: ${userMsgs.length} questions asked, ${botMsgs.length} responses given. Topics discussed: ${topics}. Session duration: ${durationStr}. Visit #${ctx.visitCount}.`;
  }

  // ── Voice Controls ────────────────────────────────────────

  private toggleListening(): void {
    if (this.isListening) {
      this.speech.stopListening();
    } else {
      if (this.isSpeaking) {
        this.speech.stopSpeaking();
      }
      this.speech.startListening(
        this.currentLang,
        (text: string, isFinal: boolean) => {
          this.ui.setTranscript(text);
          if (isFinal && text.trim()) {
            this.processUserInput(text.trim());
          }
        },
        (error: string) => {
          console.error('[VoiceCompanion] Speech recognition error:', error);
        }
      );
    }
  }

  private toggleTts(): void {
    const currentlyEnabled = this.config.enableTts !== false;
    const newState = !currentlyEnabled;
    this.config.enableTts = newState;
    this.ui.setTtsEnabled(newState);
    if (!newState && this.isSpeaking) {
      this.speech.stopSpeaking();
    }
  }

  private switchCharacter(): void {
    const next: CharacterName = this.currentCharacter === 'abe' ? 'tina' : 'abe';
    this.setCharacter(next);

    const systemMsg: ChatMessage = {
      id: `system-${Date.now()}`,
      speaker: 'system',
      text: `Switched to ${next === 'abe' ? 'Abe' : 'Tina'}`,
      timestamp: Date.now(),
    };
    this.ui.addMessage(systemMsg);
    this.events.emit('characterChanged', next);
  }

  // ── Public API Implementation ─────────────────────────────

  show(): void {
    this.onboarding.onFabClick();
  }

  hide(): void {
    this.handlePhaseChange('hidden');
  }

  minimize(): void {
    this.handlePhaseChange('minimized');
  }

  setLanguage(lang: LangCode): void {
    this.currentLang = lang;
    this.language.setLanguage(lang);
    this.ui.updateLanguage(lang);
    this.conversation.updateContext({ language: lang });
    this.events.emit('languageChanged', lang);
  }

  setCharacter(name: CharacterName): void {
    this.currentCharacter = name;
    this.ui.setActiveCharacter(name);
    this.conversation.updateContext({ activeCharacter: name });
  }

  sendMessage(text: string): void {
    this.processUserInput(text);
  }

  speak(text: string, character?: CharacterName): void {
    const char = character || this.currentCharacter;
    this.speech.speak({
      text,
      language: this.currentLang,
      character: char,
    });
  }

  stopSpeaking(): void {
    this.speech.stopSpeaking();
  }

  startListening(): void {
    this.speech.startListening(
      this.currentLang,
      (text: string, isFinal: boolean) => {
        this.ui.setTranscript(text);
        if (isFinal && text.trim()) {
          this.processUserInput(text.trim());
        }
      },
      (error: string) => {
        console.error('[VoiceCompanion] Speech recognition error:', error);
      }
    );
  }

  stopListening(): void {
    this.speech.stopListening();
  }

  navigateTo(path: string): void {
    if (this.config.navigationHandler) {
      this.config.navigationHandler(path);
    } else {
      window.location.href = path;
    }
    this.onboarding.onPageChange(path);
    this.conversation.updateContext({ currentPage: path });
    this.events.emit('navigationTriggered', path);
  }

  getContext(): ConversationContext {
    return this.conversation.getContext();
  }

  registerPlugin(plugin: VoiceCompanionPlugin): void {
    this.pluginMgr.register(plugin, this);
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    this.events.on(event, handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.events.off(event, handler);
  }

  destroy(): void {
    this.speech.stopSpeaking();
    this.speech.stopListening();
    this.pluginMgr.destroyAll();
    this.onboarding.destroy();
    this.ui.destroy();
  }

  // ── Page Update (for React wrapper) ───────────────────────

  updateCurrentPage(path: string): void {
    this.conversation.updateContext({ currentPage: path });
    this.onboarding.onPageChange(path);
  }
}

// ── Default Export ───────────────────────────────────────────

export default VoiceCompanion;

// Re-export types for consumers
export type {
  VoiceCompanionConfig,
  VoiceCompanionAPI,
  VoiceCompanionPlugin,
  LangCode,
  CharacterName,
  ChatMessage,
  ConversationContext,
  SDKEvent,
} from './types';
