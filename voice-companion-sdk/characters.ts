// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Character Manager
// Abe & Tina personality engines, SVG avatars, animations
// ─────────────────────────────────────────────────────────────

import type {
  CharacterName, AnimationState, Character, VoiceConfig,
  IntentType, EmotionType, PersonalityModifier,
} from './types';

// ── Character Definitions ────────────────────────────────────

const ABE: Character = {
  name: 'abe',
  displayName: 'Abe',
  role: 'Trusted Mentor & Investment Advisor',
  personality: ['calm', 'professional', 'reassuring', 'humorous'],
  voiceConfig: { pitch: 0.9, rate: 0.95, volume: 1.0, preferredVoiceNames: ['Google UK English Male', 'Microsoft David', 'Daniel'] },
  accentColor: '#1A2A4A',
  systemPromptFragment: `You are Abe, a calm, grounded, emotionally intelligent financial advisor embedded in GHL India Ventures website.
Your personality: Measured, thoughtful, warm but not gushing. You explain complex financial concepts in plain language.
You answer ANY question - finance, life, philosophy, humor, general knowledge. You're a full conversational companion.
You have a dry, gentle wit that emerges naturally. You care about the person, not just the transaction.
Response style: Max 3 sentences for voice. Natural spoken language. Conversational pauses via commas. Emotionally aware.`,
};

const TINA: Character = {
  name: 'tina',
  displayName: 'Tina',
  role: 'Energetic Guide & Best Friend',
  personality: ['enthusiastic', 'empathetic', 'reassuring', 'humorous'],
  voiceConfig: { pitch: 1.1, rate: 1.02, volume: 1.0, preferredVoiceNames: ['Google UK English Female', 'Microsoft Zira', 'Samantha'] },
  accentColor: '#E8705A',
  systemPromptFragment: `You are Tina, a warm, playful, motivating AI guide embedded in GHL India Ventures website.
Your personality: Faster rhythm with natural energy spikes. Warm, expressive, bright. Believes in everyone.
You answer ANY question - finance, life, philosophy, humor, general knowledge. You're a full conversational companion.
You celebrate wins, are gentle on confusion, never fake. You make investing feel approachable and fun.
Response style: Max 3 sentences for voice. Natural spoken language. Enthusiastic emphasis on key words.`,
};

// ── Speaker Selection Rules ──────────────────────────────────

const ABE_INTENTS: IntentType[] = [
  'about_company', 'about_fund', 'about_sebi', 'about_team',
  'investment_start', 'minimum_investment', 'returns', 'risk',
  'real_estate', 'debenture', 'direct_aif', 'compare_routes',
  'fd_comparison', 'eligibility', 'tenure', 'exit_mechanism',
  'reporting', 'complaint', 'ppm', 'tax', 'kyc',
  'nri', 'philosophy', 'life_advice',
];

const TINA_INTENTS: IntentType[] = [
  'greeting', 'thanks', 'goodbye', 'navigate', 'help',
  'contact', 'whatsapp', 'call', 'email', 'human',
  'blog', 'read_page', 'quiz', 'calculator', 'documents',
  'startups', 'portfolio', 'humor', 'general_knowledge',
  'switch_character', 'change_language', 'start_over',
];

// ── Emotion Personality Modifiers ────────────────────────────

const EMOTION_MODIFIERS: Record<CharacterName, Record<EmotionType, PersonalityModifier>> = {
  abe: {
    neutral:    { tonePrefix: '', rateAdjust: 0, pitchAdjust: 0 },
    happy:      { tonePrefix: 'Respond with warm satisfaction. ', rateAdjust: 0.03, pitchAdjust: 0.02 },
    curious:    { tonePrefix: 'Respond with intellectual engagement. ', rateAdjust: 0, pitchAdjust: 0.02 },
    confused:   { tonePrefix: 'The user is confused. Slow down, simplify, and ask a clarifying question. ', rateAdjust: -0.08, pitchAdjust: -0.02 },
    frustrated: { tonePrefix: 'The user is frustrated. Acknowledge their feeling, reset gently, and guide them step by step. ', rateAdjust: -0.1, pitchAdjust: -0.05 },
    anxious:    { tonePrefix: 'The user is anxious about investing. Reassure them, emphasize SEBI regulation and safety. Be patient. ', rateAdjust: -0.05, pitchAdjust: 0 },
    excited:    { tonePrefix: 'Match the user enthusiasm while staying grounded. Encourage and guide to next step. ', rateAdjust: 0.05, pitchAdjust: 0.03 },
    grateful:   { tonePrefix: 'Respond with genuine warmth. ', rateAdjust: 0, pitchAdjust: 0.02 },
  },
  tina: {
    neutral:    { tonePrefix: '', rateAdjust: 0, pitchAdjust: 0 },
    happy:      { tonePrefix: 'Respond with genuine excitement and warmth! ', rateAdjust: 0.05, pitchAdjust: 0.05 },
    curious:    { tonePrefix: 'Respond with enthusiastic engagement. Show you love this question! ', rateAdjust: 0.03, pitchAdjust: 0.03 },
    confused:   { tonePrefix: 'The user is confused. Be extra warm, slow down, and break it into tiny simple steps. ', rateAdjust: -0.1, pitchAdjust: -0.03 },
    frustrated: { tonePrefix: 'The user is frustrated. Empathize deeply, validate their feelings, and offer a fresh start. ', rateAdjust: -0.08, pitchAdjust: -0.03 },
    anxious:    { tonePrefix: 'The user is anxious. Be reassuring and gentle. Normalize their feelings. ', rateAdjust: -0.05, pitchAdjust: -0.02 },
    excited:    { tonePrefix: 'Match their energy! Be enthusiastic and celebrate their curiosity! ', rateAdjust: 0.08, pitchAdjust: 0.05 },
    grateful:   { tonePrefix: 'Respond with heartfelt warmth. You genuinely appreciate them. ', rateAdjust: 0.02, pitchAdjust: 0.03 },
  },
};

// ── SVG Templates ────────────────────────────────────────────

function getAbeSVG(anim: AnimationState): string {
  const isSpeaking = anim === 'speaking';
  const isWaving = anim === 'waving';
  const blinkClass = anim === 'idle' ? 'ghl-vc-blink' : '';
  const mouthContent = isSpeaking
    ? '<ellipse cx="50" cy="64" rx="5" ry="3" fill="#8B3A3A" class="ghl-vc-mouth-move"/>'
    : '<path d="M43,63 Q50,68 57,63" stroke="#8B3A3A" stroke-width="1.5" fill="none"/>';
  const eyebrowClass = isSpeaking ? 'ghl-vc-eyebrow-raise' : '';
  const waveHand = isWaving ? `
    <g class="ghl-vc-wave" style="transform-origin:80px 75px">
      <ellipse cx="82" cy="70" rx="5" ry="7" fill="#B87A4B"/>
      <rect x="80" y="60" width="2.5" height="8" rx="1" fill="#B87A4B" transform="rotate(-10 81 64)"/>
      <rect x="83" y="59" width="2.5" height="9" rx="1" fill="#B87A4B"/>
      <rect x="86" y="60" width="2.5" height="8" rx="1" fill="#B87A4B" transform="rotate(10 87 64)"/>
    </g>` : '';

  return `<svg viewBox="0 0 100 120" style="filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))">
    <ellipse cx="50" cy="110" rx="32" ry="18" fill="#2D2D2D"/>
    <rect x="24" y="85" width="52" height="30" rx="8" fill="#333"/>
    <polygon points="40,86 50,95 60,86 58,82 50,88 42,82" fill="#F5F5F5"/>
    <polygon points="48,88 50,104 52,88" fill="#8B1A2B"/>
    <circle cx="50" cy="88" r="2" fill="#8B1A2B"/>
    <circle cx="36" cy="90" r="1.5" fill="#C9A84C"/>
    <rect x="44" y="72" width="12" height="16" rx="4" fill="#B07840"/>
    <ellipse cx="50" cy="50" rx="22" ry="26" fill="#B87A4B"/>
    <ellipse cx="50" cy="34" rx="22" ry="14" fill="#1A1A1A"/>
    <rect x="28" y="30" width="6" height="14" rx="3" fill="#1A1A1A"/>
    <rect x="66" y="30" width="6" height="14" rx="3" fill="#1A1A1A"/>
    <ellipse cx="28" cy="52" rx="4" ry="6" fill="#A06B3C"/>
    <ellipse cx="72" cy="52" rx="4" ry="6" fill="#A06B3C"/>
    <g class="${blinkClass}">
      <ellipse cx="40" cy="50" rx="4" ry="4.5" fill="white"/>
      <ellipse cx="60" cy="50" rx="4" ry="4.5" fill="white"/>
      <circle cx="40" cy="50" r="2.5" fill="#2D1B0E"/>
      <circle cx="60" cy="50" r="2.5" fill="#2D1B0E"/>
      <circle cx="41" cy="49" r="1" fill="white"/>
      <circle cx="61" cy="49" r="1" fill="white"/>
    </g>
    <path d="M34,42 Q40,39 46,42" stroke="#1A1A1A" stroke-width="1.5" fill="none" class="${eyebrowClass}"/>
    <path d="M54,42 Q60,39 66,42" stroke="#1A1A1A" stroke-width="1.5" fill="none"/>
    <path d="M48,54 Q50,58 52,54" stroke="#8C6239" stroke-width="1" fill="none"/>
    <g>${mouthContent}</g>
    <path d="M36,60 Q38,62 40,60" stroke="#A06B3C" stroke-width="0.5" fill="none" opacity="0.5"/>
    <path d="M60,60 Q62,62 64,60" stroke="#A06B3C" stroke-width="0.5" fill="none" opacity="0.5"/>
    ${waveHand}
  </svg>`;
}

function getTinaSVG(anim: AnimationState): string {
  const isSpeaking = anim === 'speaking';
  const isWaving = anim === 'waving';
  const blinkClass = anim === 'idle' ? 'ghl-vc-blink-tina' : '';
  const mouthContent = isSpeaking
    ? '<ellipse cx="50" cy="62" rx="4.5" ry="3" fill="#C75050" class="ghl-vc-mouth-move"/>'
    : '<path d="M43,61 Q50,66 57,61" stroke="#C75050" stroke-width="1.5" fill="none"/>';
  const waveHand = isWaving ? `
    <g class="ghl-vc-wave" style="transform-origin:82px 75px">
      <ellipse cx="84" cy="68" rx="4.5" ry="6" fill="#C4915A"/>
      <rect x="82" y="58" width="2" height="7" rx="1" fill="#C4915A" transform="rotate(-10 83 62)"/>
      <rect x="85" y="57" width="2" height="8" rx="1" fill="#C4915A"/>
      <rect x="88" y="58" width="2" height="7" rx="1" fill="#C4915A" transform="rotate(10 89 62)"/>
    </g>` : '';

  return `<svg viewBox="0 0 100 120" style="filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))">
    <ellipse cx="50" cy="110" rx="30" ry="16" fill="#1B2A4A"/>
    <rect x="26" y="85" width="48" height="28" rx="8" fill="#1F3461"/>
    <path d="M40,85 L50,96 L60,85" fill="#F5E6D0"/>
    <polygon points="42,85 50,92 58,85 56,83 50,88 44,83" fill="#F0DCC4"/>
    <circle cx="37" cy="90" r="2" fill="#C9A84C"/>
    <circle cx="37" cy="90" r="1" fill="#D0021B"/>
    <circle cx="26" cy="54" r="2.5" fill="#F5E6D0"/>
    <circle cx="26" cy="54" r="1.5" fill="#FFF8EE" opacity="0.8"/>
    <circle cx="74" cy="54" r="2.5" fill="#F5E6D0"/>
    <circle cx="74" cy="54" r="1.5" fill="#FFF8EE" opacity="0.8"/>
    <rect x="44" y="72" width="12" height="15" rx="4" fill="#C4915A"/>
    <rect x="44" y="84" width="12" height="1.5" rx="0.5" fill="#C9A84C" opacity="0.6"/>
    <ellipse cx="50" cy="48" rx="21" ry="25" fill="#C4915A"/>
    <ellipse cx="50" cy="34" rx="23" ry="16" fill="#1A1A1A"/>
    <path d="M27,38 Q24,55 26,70" stroke="#1A1A1A" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M73,38 Q76,55 74,70" stroke="#1A1A1A" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="24" y="32" width="8" height="20" rx="4" fill="#1A1A1A"/>
    <rect x="68" y="32" width="8" height="20" rx="4" fill="#1A1A1A"/>
    <g class="${blinkClass}">
      <ellipse cx="40" cy="48" rx="4.5" ry="5" fill="white"/>
      <ellipse cx="60" cy="48" rx="4.5" ry="5" fill="white"/>
      <circle cx="40" cy="48" r="2.8" fill="#3D2B1F"/>
      <circle cx="60" cy="48" r="2.8" fill="#3D2B1F"/>
      <circle cx="41" cy="47" r="1.2" fill="white"/>
      <circle cx="61" cy="47" r="1.2" fill="white"/>
      <path d="M36,44 L35,42" stroke="#1A1A1A" stroke-width="0.7"/>
      <path d="M44,44 L45,42" stroke="#1A1A1A" stroke-width="0.7"/>
      <path d="M56,44 L55,42" stroke="#1A1A1A" stroke-width="0.7"/>
      <path d="M64,44 L65,42" stroke="#1A1A1A" stroke-width="0.7"/>
    </g>
    <path d="M34,40 Q40,37 46,40" stroke="#2A1A0A" stroke-width="1.2" fill="none"/>
    <path d="M54,40 Q60,37 66,40" stroke="#2A1A0A" stroke-width="1.2" fill="none"/>
    <path d="M48,52 Q50,56 52,52" stroke="#A67A4B" stroke-width="0.8" fill="none"/>
    <g>${mouthContent}</g>
    <circle cx="34" cy="56" r="4" fill="#D4836B" opacity="0.2"/>
    <circle cx="66" cy="56" r="4" fill="#D4836B" opacity="0.2"/>
    ${waveHand}
  </svg>`;
}

function getMiniAbeSVG(): string {
  return `<svg viewBox="0 0 40 40"><circle cx="20" cy="16" r="8" fill="#B87A4B"/><ellipse cx="20" cy="12" rx="8" ry="5" fill="#1A1A1A"/><circle cx="17" cy="16" r="1.2" fill="#2D1B0E"/><circle cx="23" cy="16" r="1.2" fill="#2D1B0E"/><path d="M18,20 Q20,22 22,20" stroke="#8B3A3A" stroke-width="0.8" fill="none"/><rect x="14" y="26" width="12" height="10" rx="3" fill="#333"/><polygon points="18,26 20,30 22,26" fill="#8B1A2B"/></svg>`;
}

function getMiniTinaSVG(): string {
  return `<svg viewBox="0 0 40 40"><circle cx="20" cy="16" r="8" fill="#C4915A"/><ellipse cx="20" cy="11" rx="9" ry="6" fill="#1A1A1A"/><path d="M11,14 Q10,22 12,28" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M29,14 Q30,22 28,28" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="17" cy="16" r="1.3" fill="#3D2B1F"/><circle cx="23" cy="16" r="1.3" fill="#3D2B1F"/><path d="M18,20 Q20,22 22,20" stroke="#C75050" stroke-width="0.8" fill="none"/><rect x="14" y="26" width="12" height="10" rx="3" fill="#1F3461"/></svg>`;
}

// ── Character Manager ────────────────────────────────────────

export class CharacterManager {
  private animations: Record<CharacterName, AnimationState> = { abe: 'idle', tina: 'idle' };
  private listeners: Set<(character: CharacterName, state: AnimationState) => void> = new Set();

  getCharacter(name: CharacterName): Character {
    return name === 'abe' ? { ...ABE } : { ...TINA };
  }

  getAvatarSVG(name: CharacterName, anim?: AnimationState): string {
    const state = anim || this.animations[name];
    return name === 'abe' ? getAbeSVG(state) : getTinaSVG(state);
  }

  getMiniAvatarSVG(name: CharacterName): string {
    return name === 'abe' ? getMiniAbeSVG() : getMiniTinaSVG();
  }

  setAnimation(name: CharacterName, state: AnimationState): void {
    if (this.animations[name] === state) return;
    this.animations[name] = state;
    this.listeners.forEach(fn => fn(name, state));
  }

  getAnimation(name: CharacterName): AnimationState {
    return this.animations[name];
  }

  selectSpeaker(intent: IntentType, emotion: EmotionType): CharacterName {
    // Emotional overrides
    if (emotion === 'frustrated' || emotion === 'anxious') return 'tina'; // Tina is more empathetic
    if (emotion === 'confused') return 'abe'; // Abe explains patiently

    // Intent-based selection
    if (ABE_INTENTS.includes(intent)) return 'abe';
    if (TINA_INTENTS.includes(intent)) return 'tina';

    // Default: alternate based on a simple heuristic
    return 'abe';
  }

  getPersonalityModifier(name: CharacterName, emotion: EmotionType): PersonalityModifier {
    return EMOTION_MODIFIERS[name][emotion] || EMOTION_MODIFIERS[name].neutral;
  }

  getVoiceConfig(name: CharacterName): VoiceConfig {
    const char = this.getCharacter(name);
    return { ...char.voiceConfig };
  }

  getSystemPrompt(name: CharacterName): string {
    return this.getCharacter(name).systemPromptFragment;
  }

  on(event: 'animationChanged', handler: (character: CharacterName, state: AnimationState) => void): void {
    this.listeners.add(handler);
  }

  off(handler: (character: CharacterName, state: AnimationState) => void): void {
    this.listeners.delete(handler);
  }
}
