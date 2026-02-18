// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Speech Engine
// TTS/STT abstraction: Web Speech API + ElevenLabs + Google Cloud
// ─────────────────────────────────────────────────────────────

import type {
  VoiceCompanionConfig, SpeechCapabilities, TTSRequest,
  LangCode, CharacterName, EmotionType, VoiceConfig,
} from './types';

type SpeechEventType = 'speakStart' | 'speakEnd' | 'listenStart' | 'listenEnd' | 'interim' | 'error';

const VOICE_LANG_MAP: Record<LangCode, string> = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  kn: 'kn-IN', ml: 'ml-IN', es: 'es-ES', fr: 'fr-FR',
  de: 'de-DE', ar: 'ar-SA', zh: 'zh-CN', ja: 'ja-JP',
  pt: 'pt-BR', ru: 'ru-RU',
};

const EMOTION_VOICE_MAP: Record<EmotionType, { rateAdj: number; pitchAdj: number }> = {
  neutral:    { rateAdj: 0,     pitchAdj: 0 },
  happy:      { rateAdj: 0.05,  pitchAdj: 0.05 },
  curious:    { rateAdj: 0,     pitchAdj: 0.03 },
  confused:   { rateAdj: -0.05, pitchAdj: -0.02 },
  frustrated: { rateAdj: -0.08, pitchAdj: -0.05 },
  anxious:    { rateAdj: -0.05, pitchAdj: 0 },
  excited:    { rateAdj: 0.08,  pitchAdj: 0.05 },
  grateful:   { rateAdj: 0,     pitchAdj: 0.03 },
};

const CHARACTER_VOICE: Record<CharacterName, VoiceConfig> = {
  abe:  { pitch: 0.9, rate: 0.95, volume: 1.0, preferredVoiceNames: ['Google UK English Male', 'Microsoft David', 'Daniel'] },
  tina: { pitch: 1.1, rate: 1.02, volume: 1.0, preferredVoiceNames: ['Google UK English Female', 'Microsoft Zira', 'Samantha'] },
};

export class SpeechEngine {
  private config: Partial<VoiceCompanionConfig>;
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private listeners: Map<SpeechEventType, Set<Function>> = new Map();
  private speaking = false;
  private listening = false;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private voicesLoaded = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor(config: Partial<VoiceCompanionConfig>) {
    this.config = config;
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  // ── Capability Detection ─────────────────────────────────

  detectCapabilities(): SpeechCapabilities {
    const w = typeof window !== 'undefined' ? window : null;
    const ua = w?.navigator?.userAgent || '';
    const isMobile = (w?.navigator?.maxTouchPoints || 0) > 0;
    let browserName = 'unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browserName = 'chrome';
    else if (ua.includes('Edg')) browserName = 'edge';
    else if (ua.includes('Firefox')) browserName = 'firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browserName = 'safari';

    const SR = w ? (w as any).SpeechRecognition || (w as any).webkitSpeechRecognition : null;

    return {
      ttsSupported: !!this.synth,
      sttSupported: !!SR,
      nativeVoiceCount: this.cachedVoices.length,
      preferredProvider: this.resolveProvider(),
      isMobile,
      browserName,
    };
  }

  isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  isTTSSupported(): boolean {
    return !!this.synth;
  }

  // ── Text-to-Speech ───────────────────────────────────────

  async speak(request: TTSRequest): Promise<void> {
    this.stopSpeaking();
    const provider = this.resolveProvider();

    if (provider === 'elevenlabs' && this.config.elevenLabsApiKey) {
      return this.speakElevenLabs(request);
    }
    if (provider === 'google' && this.config.googleCloudTtsKey) {
      return this.speakGoogleCloud(request);
    }
    return this.speakNative(request);
  }

  private async speakNative(request: TTSRequest): Promise<void> {
    if (!this.synth) return;

    const chunks = this.chunkText(request.text);
    const baseConfig = CHARACTER_VOICE[request.character];
    const emotionAdj = EMOTION_VOICE_MAP[request.emotion || 'neutral'];

    this.speaking = true;
    this.emit('speakStart');

    for (let i = 0; i < chunks.length; i++) {
      await this.speakChunk(chunks[i], {
        lang: VOICE_LANG_MAP[request.language] || 'en-IN',
        rate: (request.rate ?? baseConfig.rate) + emotionAdj.rateAdj + (Math.random() * 0.06 - 0.03),
        pitch: (request.pitch ?? baseConfig.pitch) + emotionAdj.pitchAdj,
        volume: baseConfig.volume,
        voiceNames: baseConfig.preferredVoiceNames,
      });

      // Pause between chunks for natural pacing
      if (i < chunks.length - 1) {
        await this.delay(200);
      }
    }

    this.speaking = false;
    this.emit('speakEnd');
  }

  private speakChunk(text: string, params: {
    lang: string; rate: number; pitch: number; volume: number; voiceNames: string[];
  }): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) { resolve(); return; }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = params.lang;
      utterance.rate = Math.max(0.5, Math.min(2.0, params.rate));
      utterance.pitch = Math.max(0.5, Math.min(2.0, params.pitch));
      utterance.volume = params.volume;

      // Select best voice
      const voice = this.selectVoice(params.lang, params.voiceNames);
      if (voice) utterance.voice = voice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      // Chrome bug: utterances > 15s get cancelled
      // Our chunking prevents this, but add safety timeout
      const timeout = setTimeout(() => {
        this.synth?.cancel();
        resolve();
      }, 15000);

      utterance.onend = () => { clearTimeout(timeout); resolve(); };
      utterance.onerror = () => { clearTimeout(timeout); resolve(); };

      this.synth.speak(utterance);
    });
  }

  private async speakElevenLabs(request: TTSRequest): Promise<void> {
    if (!this.config.elevenLabsApiKey) return;

    const voiceId = request.character === 'abe'
      ? this.config.elevenLabsVoices?.abe || 'pNInz6obpgDQGcFmaJgB'
      : this.config.elevenLabsVoices?.tina || '21m00Tcm4TlvDq8ikWAM';

    try {
      this.speaking = true;
      this.emit('speakStart');

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: request.character === 'abe' ? 0.7 : 0.5,
            similarity_boost: 0.8,
            style: request.character === 'abe' ? 0.3 : 0.6,
          },
        }),
      });

      if (!response.ok) {
        // Fallback to native
        this.speaking = false;
        return this.speakNative(request);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      this.currentAudio = new Audio(url);
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        this.speaking = false;
        this.currentAudio = null;
        this.emit('speakEnd');
      };
      this.currentAudio.onerror = () => {
        URL.revokeObjectURL(url);
        this.speaking = false;
        this.currentAudio = null;
        this.emit('speakEnd');
      };
      await this.currentAudio.play();
    } catch {
      this.speaking = false;
      this.emit('speakEnd');
      return this.speakNative(request);
    }
  }

  private async speakGoogleCloud(request: TTSRequest): Promise<void> {
    if (!this.config.googleCloudTtsKey) return;

    const langCode = VOICE_LANG_MAP[request.language] || 'en-IN';

    try {
      this.speaking = true;
      this.emit('speakStart');

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.config.googleCloudTtsKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: request.text },
            voice: {
              languageCode: langCode,
              ssmlGender: request.character === 'abe' ? 'MALE' : 'FEMALE',
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: CHARACTER_VOICE[request.character].rate,
              pitch: (CHARACTER_VOICE[request.character].pitch - 1) * 20,
            },
          }),
        }
      );

      if (!response.ok) {
        this.speaking = false;
        return this.speakNative(request);
      }

      const data = await response.json();
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      this.currentAudio = new Audio(audioSrc);
      this.currentAudio.onended = () => {
        this.speaking = false;
        this.currentAudio = null;
        this.emit('speakEnd');
      };
      this.currentAudio.onerror = () => {
        this.speaking = false;
        this.currentAudio = null;
        this.emit('speakEnd');
      };
      await this.currentAudio.play();
    } catch {
      this.speaking = false;
      this.emit('speakEnd');
      return this.speakNative(request);
    }
  }

  stopSpeaking(): void {
    this.synth?.cancel();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.speaking) {
      this.speaking = false;
      this.emit('speakEnd');
    }
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  // ── Speech Recognition ───────────────────────────────────

  startListening(
    lang: LangCode,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): void {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      onError('Speech recognition not supported');
      return;
    }

    this.stopListening();

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = VOICE_LANG_MAP[lang] || 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.listening = true;
      this.emit('listenStart');
    };

    recognition.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      if (!isFinal) {
        this.emit('interim', transcript);
      }
      onResult(transcript, isFinal);
    };

    recognition.onerror = (e: any) => {
      this.listening = false;
      this.emit('listenEnd');
      const errorMsg = e.error === 'no-speech' ? 'No speech detected'
        : e.error === 'audio-capture' ? 'Microphone not available'
        : e.error === 'not-allowed' ? 'Microphone permission denied'
        : e.error === 'network' ? 'Network error'
        : `Recognition error: ${e.error}`;
      onError(errorMsg);
      this.emit('error', errorMsg);
    };

    recognition.onend = () => {
      this.listening = false;
      this.recognition = null;
      this.emit('listenEnd');
    };

    this.recognition = recognition;

    try {
      recognition.start();
    } catch (err) {
      onError('Failed to start speech recognition');
      this.emit('error', 'Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch { /* ignore */ }
      this.recognition = null;
    }
    if (this.listening) {
      this.listening = false;
      this.emit('listenEnd');
    }
  }

  isListening(): boolean {
    return this.listening;
  }

  // ── Voice Management ─────────────────────────────────────

  getAvailableVoices(lang?: LangCode): SpeechSynthesisVoice[] {
    if (!lang) return this.cachedVoices;
    const voiceLang = VOICE_LANG_MAP[lang] || 'en-IN';
    const prefix = voiceLang.split('-')[0];
    return this.cachedVoices.filter(v =>
      v.lang === voiceLang || v.lang.startsWith(prefix)
    );
  }

  getVoiceConfig(character: CharacterName): VoiceConfig {
    return { ...CHARACTER_VOICE[character] };
  }

  // ── Events ───────────────────────────────────────────────

  on(event: SpeechEventType, handler: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: SpeechEventType, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: SpeechEventType, ...args: any[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  // ── Internals ────────────────────────────────────────────

  private loadVoices(): void {
    if (!this.synth) return;

    const load = () => {
      this.cachedVoices = this.synth!.getVoices();
      this.voicesLoaded = this.cachedVoices.length > 0;
    };

    load();
    if (!this.voicesLoaded) {
      this.synth.onvoiceschanged = load;
    }
  }

  private selectVoice(lang: string, preferredNames: string[]): SpeechSynthesisVoice | null {
    if (!this.cachedVoices.length) return null;

    const langPrefix = lang.split('-')[0];
    const langVoices = this.cachedVoices.filter(v =>
      v.lang === lang || v.lang.startsWith(langPrefix)
    );

    // Try preferred names first
    for (const name of preferredNames) {
      const found = langVoices.find(v => v.name.includes(name));
      if (found) return found;
    }

    // Prefer "Neural" or "Premium" voices
    const neural = langVoices.find(v =>
      v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Google')
    );
    if (neural) return neural;

    // Any local voice for this language
    const local = langVoices.find(v => v.localService);
    if (local) return local;

    // Any voice for this language
    return langVoices[0] || null;
  }

  private resolveProvider(): 'native' | 'elevenlabs' | 'google' {
    const pref = this.config.ttsProvider || 'auto';
    if (pref === 'elevenlabs' && this.config.elevenLabsApiKey) return 'elevenlabs';
    if (pref === 'google' && this.config.googleCloudTtsKey) return 'google';
    if (pref === 'auto') {
      if (this.config.elevenLabsApiKey) return 'elevenlabs';
      if (this.config.googleCloudTtsKey) return 'google';
    }
    return 'native';
  }

  private chunkText(text: string): string[] {
    // Split at sentence boundaries to avoid Chrome's 15-second TTS limit
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > 200) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks.length ? chunks : [text];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.stopSpeaking();
    this.stopListening();
    this.listeners.clear();
  }
}
