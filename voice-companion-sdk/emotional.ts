// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Emotion Detection Engine
// Detects user emotional state, adapts responses
// ─────────────────────────────────────────────────────────────

import type {
  EmotionType, EmotionSignal, ConversationContext,
  CharacterName, VoiceConfig,
} from './types';

// ── Emotion Keyword Patterns ─────────────────────────────────

const EMOTION_PATTERNS: Record<EmotionType, { keywords: string[]; patterns: RegExp[] }> = {
  frustrated: {
    keywords: ['frustrated', 'angry', 'upset', 'annoyed', 'terrible', 'worst', 'hate', 'useless', 'stupid', 'dumb', 'broken', 'waste'],
    patterns: [/don'?t understand/i, /not working/i, /give up/i, /waste of time/i, /this is (stupid|terrible)/i, /forget it/i, /ugh/i, /whatever/i],
  },
  confused: {
    keywords: ['confused', 'confusing', 'lost', 'unclear', 'complicated', 'complex', 'huh', 'what'],
    patterns: [/don'?t get it/i, /makes no sense/i, /too complicated/i, /i'?m lost/i, /what does .+ mean/i, /\?\?+/],
  },
  anxious: {
    keywords: ['worried', 'scared', 'nervous', 'afraid', 'risky', 'scary', 'unsafe', 'guarantee', 'lose money', 'fear'],
    patterns: [/will I lose/i, /is it safe/i, /can I trust/i, /what if/i, /I'?m scared/i, /not sure about/i, /too risky/i],
  },
  excited: {
    keywords: ['amazing', 'awesome', 'great', 'love', 'perfect', 'fantastic', 'wonderful', 'excellent', 'brilliant', 'incredible'],
    patterns: [/sign me up/i, /let'?s do it/i, /can'?t wait/i, /ready to invest/i, /this is great/i, /I love/i, /tell me more/i],
  },
  curious: {
    keywords: ['how', 'what', 'why', 'explain', 'tell me', 'know more', 'details', 'interested', 'curious', 'wonder'],
    patterns: [/how does/i, /what is/i, /can you explain/i, /tell me about/i, /I want to know/i, /how do I/i],
  },
  grateful: {
    keywords: ['thank', 'thanks', 'appreciate', 'helpful', 'wonderful help', 'great help', 'grateful', 'thankful'],
    patterns: [/thank you/i, /thanks so much/i, /much appreciated/i, /very helpful/i, /you'?re (great|amazing|wonderful)/i],
  },
  happy: {
    keywords: ['happy', 'glad', 'pleased', 'good', 'nice', 'fine', 'okay', 'cool', 'sure', 'yes'],
    patterns: [/sounds good/i, /that'?s (great|nice|good)/i, /I'?m happy/i, /glad to/i],
  },
  neutral: {
    keywords: [],
    patterns: [],
  },
};

// ── Pacing Analysis ──────────────────────────────────────────

function analyzePacing(text: string): { wordsPerMinute: number; isRushed: boolean } {
  const words = text.split(/\s+/).length;
  // Approximate: avg typing speed suggests emotional state
  // Short terse messages = potentially frustrated
  // Long messages = engaged/curious
  const isRushed = words <= 3 && /[!?]{2,}|\.{3,}/.test(text);
  return { wordsPerMinute: words, isRushed };
}

// ── Repetition Detection ─────────────────────────────────────

function detectRepetition(history: string[]): boolean {
  if (history.length < 3) return false;
  const last3 = history.slice(-3);
  // If user asked similar things 3 times, they're likely frustrated
  const similar = last3.filter(msg => {
    const lower = msg.toLowerCase();
    return last3.some(other => other !== msg && levenshteinSimilarity(lower, other.toLowerCase()) > 0.6);
  });
  return similar.length >= 2;
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;

  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) { costs[j] = j; }
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }

  return 1 - costs[longer.length] / longer.length;
}

// ── Emotion Engine ───────────────────────────────────────────

export class EmotionEngine {
  private currentState: EmotionType = 'neutral';
  private history: EmotionSignal[] = [];
  private recentUserMessages: string[] = [];
  private frustrationCount = 0;

  detect(input: string, context?: ConversationContext): EmotionSignal {
    const lower = input.toLowerCase();
    const scores: Record<EmotionType, { score: number; indicators: string[] }> = {
      neutral: { score: 0.1, indicators: [] },
      happy: { score: 0, indicators: [] },
      curious: { score: 0, indicators: [] },
      confused: { score: 0, indicators: [] },
      frustrated: { score: 0, indicators: [] },
      anxious: { score: 0, indicators: [] },
      excited: { score: 0, indicators: [] },
      grateful: { score: 0, indicators: [] },
    };

    // Keyword matching
    for (const [emotion, { keywords, patterns }] of Object.entries(EMOTION_PATTERNS) as [EmotionType, typeof EMOTION_PATTERNS[EmotionType]][]) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          scores[emotion].score += 0.3;
          scores[emotion].indicators.push(keyword);
        }
      }
      for (const pattern of patterns) {
        if (pattern.test(lower)) {
          scores[emotion].score += 0.4;
          scores[emotion].indicators.push(pattern.source);
        }
      }
    }

    // Pacing analysis
    const pacing = analyzePacing(input);
    if (pacing.isRushed) {
      scores.frustrated.score += 0.2;
      scores.frustrated.indicators.push('rushed pacing');
    }

    // Repetition analysis
    this.recentUserMessages.push(input);
    if (this.recentUserMessages.length > 10) this.recentUserMessages.shift();
    if (detectRepetition(this.recentUserMessages)) {
      scores.frustrated.score += 0.3;
      scores.frustrated.indicators.push('repetition detected');
    }

    // Punctuation signals
    if (/[!]{2,}/.test(input)) {
      scores.excited.score += 0.2;
      scores.excited.indicators.push('multiple exclamation marks');
    }
    if (/[?]{2,}/.test(input)) {
      scores.confused.score += 0.2;
      scores.confused.indicators.push('multiple question marks');
    }
    if (/\.{3,}/.test(input)) {
      scores.anxious.score += 0.1;
      scores.anxious.indicators.push('ellipsis');
    }

    // ALL CAPS detection
    if (input === input.toUpperCase() && input.length > 5 && /[A-Z]/.test(input)) {
      scores.frustrated.score += 0.3;
      scores.frustrated.indicators.push('all caps');
    }

    // Find highest scoring emotion
    let bestEmotion: EmotionType = 'neutral';
    let bestScore = 0;
    for (const [emotion, data] of Object.entries(scores) as [EmotionType, typeof scores[EmotionType]][]) {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestEmotion = emotion;
      }
    }

    const signal: EmotionSignal = {
      emotion: bestEmotion,
      confidence: Math.min(bestScore, 1.0),
      indicators: scores[bestEmotion].indicators,
    };

    this.updateState(signal);
    return signal;
  }

  updateState(signal: EmotionSignal): void {
    this.history.push(signal);
    if (this.history.length > 20) this.history.shift();

    // Track frustration escalation
    if (signal.emotion === 'frustrated') {
      this.frustrationCount++;
    } else {
      this.frustrationCount = Math.max(0, this.frustrationCount - 1);
    }

    // Update state with some momentum (don't flip-flop too fast)
    if (signal.confidence >= 0.3) {
      this.currentState = signal.emotion;
    }
  }

  getEmotionalState(): EmotionType {
    return this.currentState;
  }

  adjustVoiceParams(baseConfig: VoiceConfig, emotion: EmotionType): VoiceConfig {
    const adjustments: Record<EmotionType, { rate: number; pitch: number }> = {
      neutral:    { rate: 0, pitch: 0 },
      happy:      { rate: 0.05, pitch: 0.05 },
      curious:    { rate: 0, pitch: 0.03 },
      confused:   { rate: -0.1, pitch: -0.02 },
      frustrated: { rate: -0.1, pitch: -0.05 },
      anxious:    { rate: -0.05, pitch: 0 },
      excited:    { rate: 0.08, pitch: 0.05 },
      grateful:   { rate: 0, pitch: 0.03 },
    };

    const adj = adjustments[emotion] || adjustments.neutral;
    return {
      ...baseConfig,
      rate: baseConfig.rate + adj.rate,
      pitch: baseConfig.pitch + adj.pitch,
    };
  }

  shouldEscalateToHuman(emotion: EmotionType, context?: ConversationContext): boolean {
    // Escalate after 3+ frustrated signals
    if (this.frustrationCount >= 3) return true;
    // Escalate if user explicitly asks for human
    if (emotion === 'frustrated' && (context?.messageCount || 0) > 10) return true;
    return false;
  }

  getEmotionHistory(): EmotionSignal[] {
    return [...this.history];
  }

  getFrustrationLevel(): number {
    return this.frustrationCount;
  }

  reset(): void {
    this.currentState = 'neutral';
    this.history = [];
    this.recentUserMessages = [];
    this.frustrationCount = 0;
  }
}
