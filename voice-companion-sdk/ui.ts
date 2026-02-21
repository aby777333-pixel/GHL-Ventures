// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — UI Manager
// GHL India Ventures | Abe & Tina
// Creates and manages all DOM elements programmatically
// ─────────────────────────────────────────────────────────────

import type {
  UIPhase, UIState, CharacterName, LangCode,
  ChatMessage, Translations, MessageAction, AnimationState,
  LanguageOption,
} from './types';

// ── Inline SVG Icons ─────────────────────────────────────────

const ICONS = {
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
  volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volumeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></svg>`,
  switchUser: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-9 9"/><path d="M3 21l9-9"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
};

// ── UI Callbacks Interface ───────────────────────────────────

export interface UICallbacks {
  onSendMessage: (text: string) => void;
  onMicToggle: () => void;
  onTtsToggle: () => void;
  onLanguageSelect: (lang: LangCode) => void;
  onCharacterSwitch: () => void;
  onGreetingAccept: () => void;
  onGreetingDismiss: () => void;
  onCapabilitiesDone: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onQuickAction: (action: string) => void;
  onFabClick: () => void;
  onSummaryRequest?: () => string;
  onClearChat?: () => void;
}

// ── UI Manager Class ─────────────────────────────────────────

export class UIManager {
  private root: HTMLDivElement | null = null;
  private fab: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;
  private messagesContainer: HTMLDivElement | null = null;
  private inputField: HTMLInputElement | null = null;
  private micBtn: HTMLButtonElement | null = null;
  private sendBtn: HTMLButtonElement | null = null;
  private ttsBtn: HTMLButtonElement | null = null;
  private typingIndicator: HTMLDivElement | null = null;
  private waveformEl: HTMLDivElement | null = null;
  private headerNameEl: HTMLSpanElement | null = null;
  private headerRoleEl: HTMLDivElement | null = null;
  private headerAvatars: HTMLDivElement | null = null;
  private langOverlay: HTMLDivElement | null = null;
  private quickActionsBar: HTMLDivElement | null = null;
  private transcriptBar: HTMLDivElement | null = null;
  private voiceStatusEl: HTMLDivElement | null = null;
  private toolbarEl: HTMLDivElement | null = null;

  private state: UIState = {
    phase: 'hidden',
    activeCharacter: 'abe',
    abeAnim: 'idle',
    tinaAnim: 'idle',
    isListening: false,
    isSpeaking: false,
    isThinking: false,
    showLangPicker: false,
    transcript: '',
    ttsEnabled: true,
  };

  private callbacks: UICallbacks;
  private position: 'bottom-right' | 'bottom-left';
  private theme: 'dark' | 'light' | 'auto';
  private getAvatarSVG: (name: CharacterName) => string;
  private getMiniAvatarSVG: (name: CharacterName) => string;
  private getTranslations: () => Translations;
  private getLanguages: () => LanguageOption[];
  private currentLang: LangCode;
  private styleEl: HTMLStyleElement | null = null;

  constructor(opts: {
    callbacks: UICallbacks;
    position: 'bottom-right' | 'bottom-left';
    theme: 'dark' | 'light' | 'auto';
    getAvatarSVG: (name: CharacterName) => string;
    getMiniAvatarSVG: (name: CharacterName) => string;
    getTranslations: () => Translations;
    getLanguages: () => LanguageOption[];
    currentLang: LangCode;
  }) {
    this.callbacks = opts.callbacks;
    this.position = opts.position;
    this.theme = opts.theme;
    this.getAvatarSVG = opts.getAvatarSVG;
    this.getMiniAvatarSVG = opts.getMiniAvatarSVG;
    this.getTranslations = opts.getTranslations;
    this.getLanguages = opts.getLanguages;
    this.currentLang = opts.currentLang;
  }

  // ── Initialization ────────────────────────────────────────

  init(containerId?: string): void {
    this.injectStyles();

    this.root = document.createElement('div');
    this.root.className = 'ghl-vc';
    if (this.resolveTheme() === 'light') {
      this.root.classList.add('ghl-vc-light');
    }

    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.appendChild(this.root);
        return;
      }
    }
    document.body.appendChild(this.root);

    this.buildFAB();
    this.buildPanel();
    this.setupKeyboardShortcut();
  }

  destroy(): void {
    this.root?.remove();
    this.styleEl?.remove();
    this.root = null;
    this.fab = null;
    this.panel = null;
  }

  // ── Style Injection ───────────────────────────────────────

  private injectStyles(): void {
    if (document.getElementById('ghl-vc-styles')) return;
    this.styleEl = document.createElement('style');
    this.styleEl.id = 'ghl-vc-styles';
    // Styles are loaded via CSS import or bundled; this is a fallback marker
    this.styleEl.textContent = '/* ghl-vc styles loaded */';
    document.head.appendChild(this.styleEl);
  }

  private resolveTheme(): 'dark' | 'light' {
    if (this.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return this.theme;
  }

  // ── FAB (Floating Action Button) ──────────────────────────

  private buildFAB(): void {
    this.fab = document.createElement('div');
    this.fab.className = `ghl-vc-fab${this.position === 'bottom-left' ? ' ghl-vc-left' : ''}`;
    this.fab.setAttribute('role', 'button');
    this.fab.setAttribute('tabindex', '0');
    this.fab.setAttribute('aria-label', 'Open AI Assistant');

    // Pulse ring
    const pulse = document.createElement('div');
    pulse.className = 'ghl-vc-fab-pulse';
    this.fab.appendChild(pulse);

    // Abe mini avatar
    const abeAvatar = document.createElement('div');
    abeAvatar.className = 'ghl-vc-fab-avatar';
    abeAvatar.innerHTML = this.getMiniAvatarSVG('abe');
    this.fab.appendChild(abeAvatar);

    // Tina mini avatar
    const tinaAvatar = document.createElement('div');
    tinaAvatar.className = 'ghl-vc-fab-avatar';
    tinaAvatar.innerHTML = this.getMiniAvatarSVG('tina');
    this.fab.appendChild(tinaAvatar);

    this.fab.addEventListener('click', () => this.callbacks.onFabClick());
    this.fab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onFabClick();
      }
    });

    this.root!.appendChild(this.fab);
  }

  // ── Panel ─────────────────────────────────────────────────

  private buildPanel(): void {
    this.panel = document.createElement('div');
    this.panel.className = `ghl-vc-panel ghl-vc-hidden${this.position === 'bottom-left' ? ' ghl-vc-left' : ''}`;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'AI Assistant');

    this.buildHeader();
    this.buildGreeting();
    this.buildLangPicker();
    this.buildCapabilities();
    this.buildChat();

    this.root!.appendChild(this.panel);
  }

  // ── Header ────────────────────────────────────────────────

  private buildHeader(): void {
    const header = document.createElement('div');
    header.className = 'ghl-vc-header';

    // Avatars
    this.headerAvatars = document.createElement('div');
    this.headerAvatars.className = 'ghl-vc-header-avatars';
    this.updateHeaderAvatars();
    header.appendChild(this.headerAvatars);

    // Info
    const info = document.createElement('div');
    info.className = 'ghl-vc-header-info';

    this.headerNameEl = document.createElement('span');
    this.headerNameEl.className = 'ghl-vc-header-name';
    this.headerNameEl.innerHTML = `${this.getCharacterDisplayName()}<span class="ghl-vc-header-status"></span>`;
    info.appendChild(this.headerNameEl);

    this.headerRoleEl = document.createElement('div');
    this.headerRoleEl.className = 'ghl-vc-header-role';
    this.headerRoleEl.textContent = this.getCharacterRole();
    info.appendChild(this.headerRoleEl);

    header.appendChild(info);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'ghl-vc-header-controls';

    // Switch character
    const switchBtn = this.createHeaderBtn(ICONS.switchUser, 'Switch character');
    switchBtn.addEventListener('click', () => this.callbacks.onCharacterSwitch());
    controls.appendChild(switchBtn);

    // Language
    const langBtn = this.createHeaderBtn(ICONS.globe, 'Language');
    langBtn.addEventListener('click', () => this.toggleLangOverlay());
    controls.appendChild(langBtn);

    // TTS toggle
    this.ttsBtn = this.createHeaderBtn(ICONS.volume, 'Toggle voice');
    this.ttsBtn.addEventListener('click', () => this.callbacks.onTtsToggle());
    controls.appendChild(this.ttsBtn);

    // Minimize
    const minBtn = this.createHeaderBtn(ICONS.minus, 'Minimize');
    minBtn.addEventListener('click', () => this.callbacks.onMinimize());
    controls.appendChild(minBtn);

    // Close
    const closeBtn = this.createHeaderBtn(ICONS.x, 'Close');
    closeBtn.addEventListener('click', () => this.callbacks.onClose());
    controls.appendChild(closeBtn);

    header.appendChild(controls);
    this.panel!.appendChild(header);
  }

  private createHeaderBtn(icon: string, label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'ghl-vc-header-btn';
    btn.innerHTML = icon;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    return btn;
  }

  private updateHeaderAvatars(): void {
    if (!this.headerAvatars) return;
    this.headerAvatars.innerHTML = '';

    const abe = document.createElement('div');
    abe.className = `ghl-vc-header-avatar${this.state.activeCharacter === 'abe' ? ' ghl-vc-active' : ''}`;
    abe.innerHTML = this.getMiniAvatarSVG('abe');
    this.headerAvatars.appendChild(abe);

    const tina = document.createElement('div');
    tina.className = `ghl-vc-header-avatar${this.state.activeCharacter === 'tina' ? ' ghl-vc-active' : ''}`;
    tina.innerHTML = this.getMiniAvatarSVG('tina');
    this.headerAvatars.appendChild(tina);
  }

  // ── Greeting Phase ────────────────────────────────────────

  private greetingEl: HTMLDivElement | null = null;

  private buildGreeting(): void {
    const t = this.getTranslations();
    this.greetingEl = document.createElement('div');
    this.greetingEl.className = 'ghl-vc-greeting ghl-vc-hidden';

    // Avatars
    const avatars = document.createElement('div');
    avatars.className = 'ghl-vc-greeting-avatars';

    const abeWrap = document.createElement('div');
    abeWrap.className = 'ghl-vc-greeting-avatar ghl-vc-waving';
    abeWrap.innerHTML = this.getAvatarSVG('abe');
    avatars.appendChild(abeWrap);

    const tinaWrap = document.createElement('div');
    tinaWrap.className = 'ghl-vc-greeting-avatar';
    tinaWrap.innerHTML = this.getAvatarSVG('tina');
    avatars.appendChild(tinaWrap);

    this.greetingEl.appendChild(avatars);

    // Text
    const text = document.createElement('div');
    text.className = 'ghl-vc-greeting-text';
    text.textContent = t.welcome;
    this.greetingEl.appendChild(text);

    const sub = document.createElement('div');
    sub.className = 'ghl-vc-greeting-sub';
    sub.textContent = t.capabilities_intro;
    this.greetingEl.appendChild(sub);

    // Buttons
    const actions = document.createElement('div');
    actions.className = 'ghl-vc-greeting-actions';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'ghl-vc-btn ghl-vc-btn-primary';
    yesBtn.textContent = t.enableVoice || 'Yes, let\'s chat!';
    yesBtn.addEventListener('click', () => this.callbacks.onGreetingAccept());
    actions.appendChild(yesBtn);

    const noBtn = document.createElement('button');
    noBtn.className = 'ghl-vc-btn ghl-vc-btn-secondary';
    noBtn.textContent = t.dismiss;
    noBtn.addEventListener('click', () => this.callbacks.onGreetingDismiss());
    actions.appendChild(noBtn);

    this.greetingEl.appendChild(actions);
    this.panel!.appendChild(this.greetingEl);
  }

  // ── Language Picker Phase ─────────────────────────────────

  private langPickEl: HTMLDivElement | null = null;

  private buildLangPicker(): void {
    const t = this.getTranslations();
    this.langPickEl = document.createElement('div');
    this.langPickEl.className = 'ghl-vc-langpick ghl-vc-hidden';

    const title = document.createElement('div');
    title.className = 'ghl-vc-langpick-title';
    title.textContent = t.chooseLanguage || 'Choose your language';
    this.langPickEl.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'ghl-vc-langpick-grid';
    this.populateLanguageGrid(grid);
    this.langPickEl.appendChild(grid);

    this.panel!.appendChild(this.langPickEl);
  }

  private populateLanguageGrid(grid: HTMLDivElement): void {
    grid.innerHTML = '';
    const languages = this.getLanguages();

    for (const lang of languages) {
      const btn = document.createElement('button');
      btn.className = `ghl-vc-langpick-btn${lang.code === this.currentLang ? ' ghl-vc-active' : ''}`;

      const flag = document.createElement('span');
      flag.className = 'ghl-vc-langpick-flag';
      flag.textContent = lang.flag;
      btn.appendChild(flag);

      const nameWrap = document.createElement('span');
      nameWrap.className = 'ghl-vc-langpick-name';

      const native = document.createElement('span');
      native.className = 'ghl-vc-langpick-native';
      native.textContent = lang.native;
      nameWrap.appendChild(native);

      const english = document.createElement('span');
      english.className = 'ghl-vc-langpick-english';
      english.textContent = lang.name;
      nameWrap.appendChild(english);

      btn.appendChild(nameWrap);

      btn.addEventListener('click', () => {
        this.currentLang = lang.code;
        this.callbacks.onLanguageSelect(lang.code);
      });

      grid.appendChild(btn);
    }
  }

  // ── Capabilities Phase ────────────────────────────────────

  private capabilitiesEl: HTMLDivElement | null = null;

  private buildCapabilities(): void {
    const t = this.getTranslations();
    this.capabilitiesEl = document.createElement('div');
    this.capabilitiesEl.className = 'ghl-vc-capabilities ghl-vc-hidden';

    const title = document.createElement('div');
    title.className = 'ghl-vc-capabilities-title';
    title.textContent = t.capabilities_intro;
    this.capabilitiesEl.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'ghl-vc-capabilities-list';

    const capIcons = ['💬', '🎤', '📊', '🌐', '🤝'];
    t.capabilities.forEach((cap, i) => {
      const item = document.createElement('li');
      item.className = 'ghl-vc-capabilities-item';

      const icon = document.createElement('span');
      icon.className = 'ghl-vc-capabilities-icon';
      icon.textContent = capIcons[i] || '✨';
      item.appendChild(icon);

      const text = document.createElement('span');
      text.textContent = cap;
      item.appendChild(text);

      list.appendChild(item);
    });

    this.capabilitiesEl.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'ghl-vc-capabilities-footer';

    const startBtn = document.createElement('button');
    startBtn.className = 'ghl-vc-btn ghl-vc-btn-primary';
    startBtn.textContent = 'Start Chatting';
    startBtn.addEventListener('click', () => this.callbacks.onCapabilitiesDone());
    footer.appendChild(startBtn);

    this.capabilitiesEl.appendChild(footer);
    this.panel!.appendChild(this.capabilitiesEl);
  }

  // ── Chat Phase ────────────────────────────────────────────

  private chatEl: HTMLDivElement | null = null;

  private buildChat(): void {
    this.chatEl = document.createElement('div');
    this.chatEl.className = 'ghl-vc-chat ghl-vc-hidden';

    // Messages area
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'ghl-vc-messages';
    this.messagesContainer.setAttribute('role', 'log');
    this.messagesContainer.setAttribute('aria-live', 'polite');
    this.chatEl.appendChild(this.messagesContainer);

    // Waveform (hidden by default)
    this.waveformEl = document.createElement('div');
    this.waveformEl.className = 'ghl-vc-waveform ghl-vc-hidden';
    for (let i = 0; i < 7; i++) {
      const bar = document.createElement('div');
      bar.className = 'ghl-vc-waveform-bar';
      this.waveformEl.appendChild(bar);
    }
    this.chatEl.appendChild(this.waveformEl);

    // Typing indicator (hidden by default)
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'ghl-vc-typing ghl-vc-hidden';

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'ghl-vc-typing-dots';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'ghl-vc-typing-dot';
      dotsWrap.appendChild(dot);
    }
    this.typingIndicator.appendChild(dotsWrap);

    const typingLabel = document.createElement('span');
    typingLabel.className = 'ghl-vc-typing-label';
    typingLabel.textContent = this.getTranslations().thinking;
    this.typingIndicator.appendChild(typingLabel);

    this.chatEl.appendChild(this.typingIndicator);

    // Live transcript bar (visible during voice input)
    this.transcriptBar = document.createElement('div');
    this.transcriptBar.className = 'ghl-vc-transcript-bar ghl-vc-hidden';
    this.transcriptBar.innerHTML = `
      <div class="ghl-vc-transcript-indicator">
        <span class="ghl-vc-transcript-pulse"></span>
        <span class="ghl-vc-transcript-label">Listening</span>
      </div>
      <div class="ghl-vc-transcript-text"></div>
    `;
    this.chatEl.appendChild(this.transcriptBar);

    // Voice status indicator
    this.voiceStatusEl = document.createElement('div');
    this.voiceStatusEl.className = 'ghl-vc-voice-status ghl-vc-hidden';
    this.chatEl.appendChild(this.voiceStatusEl);

    // Toolbar (summary, clear, voice commands)
    this.toolbarEl = document.createElement('div');
    this.toolbarEl.className = 'ghl-vc-toolbar';

    const summaryBtn = document.createElement('button');
    summaryBtn.className = 'ghl-vc-toolbar-btn';
    summaryBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>`;
    summaryBtn.title = 'Get conversation summary';
    summaryBtn.addEventListener('click', () => this.showSummary());
    this.toolbarEl.appendChild(summaryBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'ghl-vc-toolbar-btn';
    clearBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    clearBtn.title = 'Clear conversation';
    clearBtn.addEventListener('click', () => {
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = '';
        this.callbacks.onClearChat?.();
      }
    });
    this.toolbarEl.appendChild(clearBtn);

    const advisoryBtn = document.createElement('button');
    advisoryBtn.className = 'ghl-vc-toolbar-btn';
    advisoryBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
    advisoryBtn.title = 'Investment advisory tips';
    advisoryBtn.addEventListener('click', () => this.showAdvisoryTips());
    this.toolbarEl.appendChild(advisoryBtn);

    this.chatEl.appendChild(this.toolbarEl);

    // Quick actions
    this.quickActionsBar = document.createElement('div');
    this.quickActionsBar.className = 'ghl-vc-quick-actions';
    this.updateQuickActions();
    this.chatEl.appendChild(this.quickActionsBar);

    // Input bar
    const inputBar = document.createElement('div');
    inputBar.className = 'ghl-vc-input-bar';

    this.inputField = document.createElement('input');
    this.inputField.type = 'text';
    this.inputField.className = 'ghl-vc-input-field';
    this.inputField.placeholder = this.getTranslations().inputPlaceholder;
    this.inputField.setAttribute('aria-label', 'Type a message');
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.inputField!.value.trim()) {
        this.handleSend();
      }
    });
    this.inputField.addEventListener('input', () => {
      this.updateSendButton();
    });
    inputBar.appendChild(this.inputField);

    // Mic button
    this.micBtn = document.createElement('button');
    this.micBtn.className = 'ghl-vc-input-btn ghl-vc-mic-btn';
    this.micBtn.innerHTML = ICONS.mic;
    this.micBtn.setAttribute('aria-label', 'Voice input');
    this.micBtn.addEventListener('click', () => this.callbacks.onMicToggle());
    inputBar.appendChild(this.micBtn);

    // Send button
    this.sendBtn = document.createElement('button');
    this.sendBtn.className = 'ghl-vc-input-btn ghl-vc-send-btn';
    this.sendBtn.innerHTML = ICONS.send;
    this.sendBtn.setAttribute('aria-label', 'Send message');
    this.sendBtn.disabled = true;
    this.sendBtn.addEventListener('click', () => this.handleSend());
    inputBar.appendChild(this.sendBtn);

    this.chatEl.appendChild(inputBar);

    // Disclaimer
    const disclaimer = document.createElement('div');
    disclaimer.className = 'ghl-vc-disclaimer';
    const t = this.getTranslations();
    disclaimer.innerHTML = `${t.disclaimer} <a href="/privacy" target="_blank">${t.privacyLink}</a>`;
    this.chatEl.appendChild(disclaimer);

    this.panel!.appendChild(this.chatEl);
  }

  private handleSend(): void {
    const text = this.inputField?.value.trim();
    if (!text) return;
    this.callbacks.onSendMessage(text);
    this.inputField!.value = '';
    this.updateSendButton();
  }

  private updateSendButton(): void {
    if (this.sendBtn && this.inputField) {
      this.sendBtn.disabled = !this.inputField.value.trim();
    }
  }

  private updateQuickActions(): void {
    if (!this.quickActionsBar) return;
    this.quickActionsBar.innerHTML = '';

    const t = this.getTranslations();
    if (!t.quickActions) return;

    for (const qa of t.quickActions) {
      const btn = document.createElement('button');
      btn.className = 'ghl-vc-quick-btn';
      btn.textContent = qa.label;
      btn.addEventListener('click', () => this.callbacks.onQuickAction(qa.action));
      this.quickActionsBar.appendChild(btn);
    }
  }

  // ── Language Overlay ──────────────────────────────────────

  private toggleLangOverlay(): void {
    if (this.langOverlay) {
      this.langOverlay.remove();
      this.langOverlay = null;
      return;
    }

    this.langOverlay = document.createElement('div');
    this.langOverlay.className = 'ghl-vc-lang-overlay';

    const header = document.createElement('div');
    header.className = 'ghl-vc-lang-overlay-header';

    const title = document.createElement('span');
    title.className = 'ghl-vc-lang-overlay-title';
    title.textContent = this.getTranslations().chooseLanguage || 'Language';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ghl-vc-lang-overlay-close';
    closeBtn.innerHTML = ICONS.x;
    closeBtn.addEventListener('click', () => {
      this.langOverlay?.remove();
      this.langOverlay = null;
    });
    header.appendChild(closeBtn);

    this.langOverlay.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'ghl-vc-lang-overlay-grid ghl-vc-langpick-grid';
    this.populateLanguageGrid(grid);
    this.langOverlay.appendChild(grid);

    this.panel!.appendChild(this.langOverlay);
  }

  // ── Phase Management ──────────────────────────────────────

  setPhase(phase: UIPhase): void {
    this.state.phase = phase;

    // Hide all phase containers
    this.greetingEl?.classList.add('ghl-vc-hidden');
    this.langPickEl?.classList.add('ghl-vc-hidden');
    this.capabilitiesEl?.classList.add('ghl-vc-hidden');
    this.chatEl?.classList.add('ghl-vc-hidden');

    switch (phase) {
      case 'hidden':
        this.panel?.classList.add('ghl-vc-hidden');
        this.fab?.classList.remove('ghl-vc-hidden');
        break;

      case 'minimized':
        this.panel?.classList.add('ghl-vc-hidden');
        this.fab?.classList.remove('ghl-vc-hidden');
        break;

      case 'greeting':
        this.panel?.classList.remove('ghl-vc-hidden');
        this.fab?.classList.add('ghl-vc-hidden');
        this.greetingEl?.classList.remove('ghl-vc-hidden');
        break;

      case 'langPick':
        this.panel?.classList.remove('ghl-vc-hidden');
        this.fab?.classList.add('ghl-vc-hidden');
        this.langPickEl?.classList.remove('ghl-vc-hidden');
        break;

      case 'capabilities':
        this.panel?.classList.remove('ghl-vc-hidden');
        this.fab?.classList.add('ghl-vc-hidden');
        this.capabilitiesEl?.classList.remove('ghl-vc-hidden');
        break;

      case 'chat':
        this.panel?.classList.remove('ghl-vc-hidden');
        this.fab?.classList.add('ghl-vc-hidden');
        this.chatEl?.classList.remove('ghl-vc-hidden');
        this.inputField?.focus();
        break;
    }
  }

  // ── Message Rendering ─────────────────────────────────────

  addMessage(msg: ChatMessage, avatarSVG?: string): void {
    if (!this.messagesContainer) return;

    const wrapper = document.createElement('div');
    const isUser = msg.speaker === 'user';
    const isSystem = msg.speaker === 'system';

    wrapper.className = `ghl-vc-msg ${isUser ? 'ghl-vc-msg-user' : isSystem ? 'ghl-vc-msg-system' : 'ghl-vc-msg-bot'}`;
    wrapper.id = `msg-${msg.id}`;

    // Avatar (for bot messages)
    if (!isUser && !isSystem && avatarSVG) {
      const avatar = document.createElement('div');
      avatar.className = 'ghl-vc-msg-avatar';
      avatar.innerHTML = avatarSVG;
      wrapper.appendChild(avatar);
    }

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = 'ghl-vc-msg-bubble';

    // Speaker name (for bot messages)
    if (!isUser && !isSystem) {
      const name = document.createElement('div');
      name.className = 'ghl-vc-msg-name';
      name.textContent = msg.speaker === 'abe' ? 'Abe' : 'Tina';
      bubble.appendChild(name);
    }

    // Message text
    const text = document.createElement('div');
    text.textContent = msg.text;
    bubble.appendChild(text);

    // Actions
    if (msg.actions && msg.actions.length > 0) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'ghl-vc-msg-actions';

      for (const action of msg.actions) {
        const chip = document.createElement('button');
        chip.className = 'ghl-vc-action-chip';
        chip.textContent = action.label || action.type;
        chip.addEventListener('click', () => {
          this.callbacks.onQuickAction(`${action.type}:${action.data || ''}`);
        });
        actionsEl.appendChild(chip);
      }
      bubble.appendChild(actionsEl);
    }

    // Timestamp
    const time = document.createElement('div');
    time.className = 'ghl-vc-msg-time';
    time.textContent = this.formatTime(msg.timestamp);
    bubble.appendChild(time);

    wrapper.appendChild(bubble);
    this.messagesContainer.appendChild(wrapper);
    this.scrollToBottom();
  }

  updateLastBotMessage(text: string): void {
    if (!this.messagesContainer) return;
    const msgs = this.messagesContainer.querySelectorAll('.ghl-vc-msg-bot .ghl-vc-msg-bubble > div:nth-child(2)');
    const last = msgs[msgs.length - 1];
    if (last) {
      last.textContent = text;
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ── State Updates ─────────────────────────────────────────

  setThinking(thinking: boolean): void {
    this.state.isThinking = thinking;
    if (this.typingIndicator) {
      this.typingIndicator.classList.toggle('ghl-vc-hidden', !thinking);
    }
    if (thinking) this.scrollToBottom();
  }

  setListening(listening: boolean): void {
    this.state.isListening = listening;
    this.micBtn?.classList.toggle('ghl-vc-listening', listening);
    // Show/hide transcript bar
    this.transcriptBar?.classList.toggle('ghl-vc-hidden', !listening);
    if (listening) {
      const textEl = this.transcriptBar?.querySelector('.ghl-vc-transcript-text');
      if (textEl) textEl.textContent = '';
      this.showVoiceStatus('Listening... speak now');
    } else {
      this.hideVoiceStatus();
    }
  }

  setSpeaking(speaking: boolean): void {
    this.state.isSpeaking = speaking;
    this.waveformEl?.classList.toggle('ghl-vc-hidden', !speaking);
  }

  setTtsEnabled(enabled: boolean): void {
    this.state.ttsEnabled = enabled;
    if (this.ttsBtn) {
      this.ttsBtn.innerHTML = enabled ? ICONS.volume : ICONS.volumeOff;
      this.ttsBtn.classList.toggle('ghl-vc-active', enabled);
    }
  }

  setTranscript(text: string): void {
    this.state.transcript = text;
    if (this.inputField) {
      this.inputField.value = text;
      this.updateSendButton();
    }
    // Update live transcript bar
    const textEl = this.transcriptBar?.querySelector('.ghl-vc-transcript-text');
    if (textEl) textEl.textContent = text || '';
  }

  setActiveCharacter(name: CharacterName): void {
    this.state.activeCharacter = name;
    this.updateHeaderAvatars();
    if (this.headerNameEl) {
      this.headerNameEl.innerHTML = `${this.getCharacterDisplayName()}<span class="ghl-vc-header-status"></span>`;
    }
    if (this.headerRoleEl) {
      this.headerRoleEl.textContent = this.getCharacterRole();
    }
  }

  updateLanguage(lang: LangCode): void {
    this.currentLang = lang;
    const t = this.getTranslations();

    // Update text content throughout
    if (this.inputField) {
      this.inputField.placeholder = t.inputPlaceholder;
    }
    if (this.typingIndicator) {
      const label = this.typingIndicator.querySelector('.ghl-vc-typing-label');
      if (label) label.textContent = t.thinking;
    }

    this.updateQuickActions();

    // Close lang overlay if open
    if (this.langOverlay) {
      this.langOverlay.remove();
      this.langOverlay = null;
    }

    // Update RTL
    if (this.root) {
      if (lang === 'ar') {
        this.root.setAttribute('dir', 'rtl');
      } else {
        this.root.removeAttribute('dir');
      }
    }
  }

  // ── Toast Notification ────────────────────────────────────

  showToast(text: string, duration = 4000): void {
    const existing = this.root?.querySelector('.ghl-vc-toast');
    existing?.remove();

    const toast = document.createElement('div');
    toast.className = `ghl-vc-toast${this.position === 'bottom-left' ? ' ghl-vc-left' : ''}`;
    toast.textContent = text;
    toast.addEventListener('click', () => {
      toast.remove();
      this.callbacks.onFabClick();
    });

    this.root?.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
  }

  // ── Keyboard Shortcut ─────────────────────────────────────

  private setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e) => {
      // Alt+V to toggle
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        this.callbacks.onFabClick();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  private getCharacterDisplayName(): string {
    return this.state.activeCharacter === 'abe' ? 'Abe' : 'Tina';
  }

  private getCharacterRole(): string {
    return this.state.activeCharacter === 'abe'
      ? 'Investment Advisor'
      : 'Portfolio Navigator';
  }

  getState(): UIState {
    return { ...this.state };
  }

  getInputField(): HTMLInputElement | null {
    return this.inputField;
  }

  focusInput(): void {
    this.inputField?.focus();
  }

  clearMessages(): void {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }
  }

  hideFAB(): void {
    this.fab?.classList.add('ghl-vc-hidden');
  }

  showFAB(): void {
    this.fab?.classList.remove('ghl-vc-hidden');
  }

  // ── Voice Status ──────────────────────────────────────────

  showVoiceStatus(text: string): void {
    if (!this.voiceStatusEl) return;
    this.voiceStatusEl.textContent = text;
    this.voiceStatusEl.classList.remove('ghl-vc-hidden');
  }

  hideVoiceStatus(): void {
    this.voiceStatusEl?.classList.add('ghl-vc-hidden');
  }

  // ── Conversation Summary ──────────────────────────────────

  private showSummary(): void {
    const summary = this.callbacks.onSummaryRequest?.();
    if (!summary) {
      this.addSystemMessage('No conversation to summarize yet. Start chatting first!');
      return;
    }
    this.addSystemMessage(summary);
  }

  addSystemMessage(text: string): void {
    if (!this.messagesContainer) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'ghl-vc-msg ghl-vc-msg-system';
    const bubble = document.createElement('div');
    bubble.className = 'ghl-vc-msg-bubble';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    this.messagesContainer.appendChild(wrapper);
    this.scrollToBottom();
  }

  // ── Advisory Tips ─────────────────────────────────────────

  private showAdvisoryTips(): void {
    const tips = [
      'Start with our Risk Quiz to find your ideal investment profile',
      'AIF minimum is as per SEBI AIF Regulations | SEBI Co-Invest Framework also available',
      'GHL India Ventures is SEBI registered (IN/AIF2/2425/1517)',
      'Ask me about returns, risk, portfolio companies, or exit mechanisms',
      'Say "compare routes" to see AIF vs Co-Invest side by side',
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.addSystemMessage(`\uD83D\uDCA1 Advisory: ${randomTip}`);
  }
}
