// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Onboarding Manager
// GHL India Ventures | Abe & Tina
// Handles first-visit flow, returning visitors, proactive nudges
// ─────────────────────────────────────────────────────────────

import type { UIPhase, LangCode } from './types';

// ── Proactive Messages ──────────────────────────────────────

interface ProactiveMessage {
  page: string;
  delay: number;
  message: string;
  trigger: 'pageload' | 'idle' | 'scroll';
}

const PROACTIVE_MESSAGES: ProactiveMessage[] = [
  { page: '/', delay: 30000, message: 'Welcome! I can help you explore investment opportunities with GHL India Ventures.', trigger: 'idle' },
  { page: '/about', delay: 5000, message: 'Want to know more about our SEBI-registered AIF? Just ask!', trigger: 'pageload' },
  { page: '/portfolio', delay: 5000, message: 'Curious about any of our portfolio companies? I can share details.', trigger: 'pageload' },
  { page: '/invest', delay: 3000, message: 'Ready to start your investment journey? I can walk you through the process.', trigger: 'pageload' },
  { page: '/contact', delay: 3000, message: 'Need help reaching our team? I can connect you right away.', trigger: 'pageload' },
  { page: '/debenture', delay: 5000, message: 'Interested in our Non-Convertible Debentures? I can explain the benefits.', trigger: 'pageload' },
  { page: '/team', delay: 5000, message: 'Want to learn about the people behind GHL India Ventures?', trigger: 'pageload' },
  { page: '/blog', delay: 10000, message: 'Looking for market insights? Ask me about trends and analysis.', trigger: 'idle' },
];

const SCROLL_NUDGE_MESSAGE = 'Having questions about what you\'re reading? I\'m here to help!';
const IDLE_NUDGE_DELAY = 30000; // 30 seconds
const SCROLL_NUDGE_THRESHOLD = 0.7; // 70% scroll depth

// ── Storage Keys ────────────────────────────────────────────

const STORAGE_KEYS = {
  visitCount: 'ghl-vc-visitcount',
  lastVisit: 'ghl-vc-lastvisit',
  dismissed: 'ghl-vc-dismissed',
  onboardingComplete: 'ghl-vc-onboarded',
  nudgeShown: 'ghl-vc-nudge-shown',
};

// ── Onboarding Manager ─────────────────────────────────────

export interface OnboardingCallbacks {
  onPhaseChange: (phase: UIPhase) => void;
  onShowToast: (message: string) => void;
  onLanguageDetected: (lang: LangCode) => void;
}

export class OnboardingManager {
  private callbacks: OnboardingCallbacks;
  private visitCount: number;
  private dismissed: boolean;
  private onboardingComplete: boolean;
  private autoGreet: boolean;
  private autoGreetDelay: number;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollHandler: (() => void) | null = null;
  private nudgeShownThisSession = false;
  private currentPage = '/';

  constructor(opts: {
    callbacks: OnboardingCallbacks;
    autoGreet: boolean;
    autoGreetDelay: number;
  }) {
    this.callbacks = opts.callbacks;
    this.autoGreet = opts.autoGreet;
    this.autoGreetDelay = opts.autoGreetDelay;

    // Load visit data
    this.visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.visitCount) || '0', 10);
    this.dismissed = localStorage.getItem(STORAGE_KEYS.dismissed) === 'true';
    this.onboardingComplete = localStorage.getItem(STORAGE_KEYS.onboardingComplete) === 'true';

    // Increment visit count
    this.visitCount++;
    localStorage.setItem(STORAGE_KEYS.visitCount, String(this.visitCount));
    localStorage.setItem(STORAGE_KEYS.lastVisit, String(Date.now()));
  }

  // ── Start Onboarding ──────────────────────────────────────

  start(): void {
    if (!this.autoGreet) {
      this.callbacks.onPhaseChange('minimized');
      return;
    }

    if (this.dismissed) {
      // Previously dismissed — show minimized with nudges
      this.callbacks.onPhaseChange('minimized');
      this.setupIdleNudge();
      this.setupScrollNudge();
      return;
    }

    if (this.onboardingComplete) {
      // Returning visitor — show minimized + welcome back toast
      this.callbacks.onPhaseChange('minimized');
      setTimeout(() => {
        this.callbacks.onShowToast(
          this.visitCount > 3
            ? 'Welcome back! How can I help today?'
            : 'Good to see you again! Need any help?'
        );
      }, 2000);
      this.setupIdleNudge();
      this.setupScrollNudge();
      return;
    }

    // First visit — full onboarding with delay
    setTimeout(() => {
      this.callbacks.onPhaseChange('greeting');
    }, this.autoGreetDelay);
  }

  // ── Phase Transitions ─────────────────────────────────────

  onGreetingAccept(): void {
    this.callbacks.onPhaseChange('langPick');
  }

  onGreetingDismiss(): void {
    this.dismissed = true;
    localStorage.setItem(STORAGE_KEYS.dismissed, 'true');
    this.callbacks.onPhaseChange('minimized');
    this.callbacks.onShowToast('No worries! Click me anytime you need help.');
    this.setupIdleNudge();
    this.setupScrollNudge();
  }

  onLanguageSelected(): void {
    this.callbacks.onPhaseChange('capabilities');
  }

  onCapabilitiesDone(): void {
    this.onboardingComplete = true;
    localStorage.setItem(STORAGE_KEYS.onboardingComplete, 'true');
    this.callbacks.onPhaseChange('chat');
  }

  onFabClick(): void {
    if (this.onboardingComplete) {
      this.callbacks.onPhaseChange('chat');
    } else {
      this.callbacks.onPhaseChange('greeting');
    }
  }

  onMinimize(): void {
    this.callbacks.onPhaseChange('minimized');
  }

  onClose(): void {
    this.callbacks.onPhaseChange('hidden');
  }

  // ── Page Navigation ───────────────────────────────────────

  onPageChange(path: string): void {
    this.currentPage = path;
    this.nudgeShownThisSession = false;

    // Check for page-specific proactive messages
    const msg = PROACTIVE_MESSAGES.find(
      m => m.trigger === 'pageload' && path.startsWith(m.page) && m.page !== '/'
    );

    if (msg && this.onboardingComplete && !this.dismissed) {
      setTimeout(() => {
        this.callbacks.onShowToast(msg.message);
      }, msg.delay);
    }
  }

  // ── Proactive Nudges ──────────────────────────────────────

  private setupIdleNudge(): void {
    this.clearIdleTimer();

    const idleMsg = PROACTIVE_MESSAGES.find(
      m => m.trigger === 'idle' && this.currentPage.startsWith(m.page)
    );
    const delay = idleMsg?.delay || IDLE_NUDGE_DELAY;

    this.idleTimer = setTimeout(() => {
      if (!this.nudgeShownThisSession) {
        this.nudgeShownThisSession = true;
        const message = idleMsg?.message || 'Need any help? I\'m here if you have questions!';
        this.callbacks.onShowToast(message);
      }
    }, delay);

    // Reset timer on user activity
    const resetTimer = () => {
      this.clearIdleTimer();
      if (!this.nudgeShownThisSession) {
        this.idleTimer = setTimeout(() => {
          this.nudgeShownThisSession = true;
          const message = idleMsg?.message || 'Need any help? I\'m here if you have questions!';
          this.callbacks.onShowToast(message);
        }, delay);
      }
    };

    document.addEventListener('mousemove', resetTimer, { passive: true });
    document.addEventListener('keydown', resetTimer, { passive: true });
    document.addEventListener('touchstart', resetTimer, { passive: true });
  }

  private setupScrollNudge(): void {
    if (this.scrollHandler) return;

    this.scrollHandler = () => {
      if (this.nudgeShownThisSession) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      if (scrollPercent >= SCROLL_NUDGE_THRESHOLD) {
        this.nudgeShownThisSession = true;
        this.callbacks.onShowToast(SCROLL_NUDGE_MESSAGE);
      }
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  // ── Getters ───────────────────────────────────────────────

  getVisitCount(): number {
    return this.visitCount;
  }

  isReturningVisitor(): boolean {
    return this.visitCount > 1;
  }

  isOnboardingComplete(): boolean {
    return this.onboardingComplete;
  }

  // ── Cleanup ───────────────────────────────────────────────

  destroy(): void {
    this.clearIdleTimer();
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
  }
}
