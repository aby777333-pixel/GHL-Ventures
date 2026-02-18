# Voice AI Companion SDK

**GHL India Ventures | Abe & Tina**

A production-ready, emotionally intelligent, multilingual Voice AI Companion featuring two AI characters — Abe (calm investment advisor) and Tina (energetic portfolio navigator) — powered by Claude AI.

## Quick Start

### Next.js Integration

```tsx
// components/VoiceCompanion.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { VoiceCompanion } from '@/voice-companion-sdk';

export default function VoiceCompanionWrapper() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let companion: InstanceType<typeof VoiceCompanion>;

    VoiceCompanion.create({
      defaultCharacter: 'abe',
      language: 'en',
      enableTts: true,
      autoGreet: true,
      navigationHandler: (path) => router.push(path),
    }).then(c => { companion = c; });

    return () => companion?.destroy();
  }, [router]);

  return null;
}
```

### Standalone HTML

```html
<link rel="stylesheet" href="voice-companion-sdk/styles.css">
<script type="module">
  import { VoiceCompanion } from './voice-companion-sdk/index.ts';

  const companion = await VoiceCompanion.create({
    defaultCharacter: 'abe',
    enableTts: true,
    autoGreet: true,
  });
</script>
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | `string` | - | DOM element ID to mount into |
| `claudeApiKey` | `string` | - | Claude API key for AI responses |
| `claudeProxyUrl` | `string` | - | Backend proxy URL for production |
| `defaultCharacter` | `'abe' \| 'tina'` | `'abe'` | Starting character |
| `language` | `LangCode` | `'en'` | Default language (14 supported) |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | UI theme |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Panel position |
| `autoGreet` | `boolean` | `true` | Auto-show greeting on first visit |
| `autoGreetDelay` | `number` | `2500` | Delay before greeting (ms) |
| `enableTts` | `boolean` | `true` | Enable text-to-speech |
| `enableVoice` | `boolean` | `true` | Enable voice input |
| `enableClaudeAI` | `boolean` | `true` | Enable Claude AI responses |
| `ttsProvider` | `TTSProvider` | `'auto'` | TTS engine preference |
| `navigationHandler` | `(path) => void` | - | Custom navigation handler |
| `actionHandler` | `(action, data) => void` | - | Custom action handler |

## Public API

```typescript
const companion = await VoiceCompanion.create(config);

companion.show();              // Open the companion panel
companion.hide();              // Hide completely
companion.minimize();          // Minimize to FAB
companion.setLanguage('hi');   // Switch language
companion.setCharacter('tina');// Switch character
companion.sendMessage('text'); // Send a message programmatically
companion.speak('text');       // Speak text via TTS
companion.stopSpeaking();      // Stop TTS
companion.startListening();    // Start voice input
companion.stopListening();     // Stop voice input
companion.navigateTo('/about');// Trigger navigation
companion.getContext();        // Get conversation context
companion.registerPlugin(p);   // Register a plugin
companion.on('event', fn);    // Subscribe to events
companion.off('event', fn);   // Unsubscribe
companion.destroy();           // Cleanup
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | - | SDK initialized |
| `error` | `Error` | Error occurred |
| `messageAdded` | `ChatMessage` | New message in chat |
| `phaseChanged` | `UIPhase` | UI state changed |
| `languageChanged` | `LangCode` | Language switched |
| `characterChanged` | `CharacterName` | Character switched |
| `emotionDetected` | `EmotionSignal` | Emotion detected in user input |
| `speakStart` / `speakEnd` | - | TTS started/stopped |
| `listenStart` / `listenEnd` | - | Voice input started/stopped |
| `intentClassified` | `IntentResult` | Intent classified |
| `navigationTriggered` | `string` | Navigation occurred |

## Supported Languages

English, Hindi, Tamil, Telugu, Kannada, Malayalam, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Russian

## Keyboard Shortcut

`Alt+V` — Toggle companion panel

## Architecture

```
voice-companion-sdk/
  types.ts          — TypeScript interfaces
  speech.ts         — TTS/STT abstraction (Web Speech API + ElevenLabs + Google)
  language.ts       — 14 languages, IP detection, translations
  characters.ts     — Abe & Tina personalities, SVG avatars
  intent.ts         — Intent classifier, navigation routing
  conversation.ts   — Claude API integration, context management
  investment.ts     — Financial knowledge base
  emotional.ts      — Emotion detection & adaptive responses
  ui.ts             — DOM creation, floating panel
  onboarding.ts     — First-visit experience, proactive nudges
  plugins.ts        — Extension API
  index.ts          — Main orchestrator
  styles.css        — All styling (CSS custom properties)
```

## Plugin System

```typescript
const myPlugin: VoiceCompanionPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  init(api) { /* setup */ },
  handleIntent(intent, input) {
    if (intent === 'quiz') {
      return [{ id: '1', speaker: 'tina', text: 'Quiz time!', timestamp: Date.now() }];
    }
    return null;
  },
  destroy() { /* cleanup */ },
};

companion.registerPlugin(myPlugin);
```
