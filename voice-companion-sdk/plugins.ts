// ─────────────────────────────────────────────────────────────
// Voice AI Companion SDK — Plugin System
// GHL India Ventures | Abe & Tina
// Extension API for custom plugins
// ─────────────────────────────────────────────────────────────

import type {
  VoiceCompanionPlugin, VoiceCompanionAPI,
  IntentType, ActionType, ChatMessage,
} from './types';

// ── Plugin Registry ─────────────────────────────────────────

export class PluginRegistry {
  private plugins = new Map<string, VoiceCompanionPlugin>();
  private api: VoiceCompanionAPI | null = null;

  setAPI(api: VoiceCompanionAPI): void {
    this.api = api;
  }

  register(plugin: VoiceCompanionPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[VoiceCompanion] Plugin "${plugin.name}" is already registered`);
      return;
    }

    if (!this.api) {
      console.error('[VoiceCompanion] Cannot register plugin before SDK is initialized');
      return;
    }

    this.plugins.set(plugin.name, plugin);
    plugin.init(this.api);
    console.log(`[VoiceCompanion] Plugin "${plugin.name}" v${plugin.version} registered`);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy?.();
      this.plugins.delete(name);
      console.log(`[VoiceCompanion] Plugin "${name}" unregistered`);
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

  getRegistered(): string[] {
    return Array.from(this.plugins.keys());
  }

  destroyAll(): void {
    this.plugins.forEach(p => p.destroy?.());
    this.plugins.clear();
  }
}

// ── Example Plugin Template ─────────────────────────────────

/**
 * Example plugin that handles a custom "quiz" intent:
 *
 * ```typescript
 * const quizPlugin: VoiceCompanionPlugin = {
 *   name: 'investment-quiz',
 *   version: '1.0.0',
 *   init(api) {
 *     console.log('Quiz plugin ready');
 *   },
 *   handleIntent(intent, input) {
 *     if (intent === 'quiz') {
 *       return [{
 *         id: `quiz-${Date.now()}`,
 *         speaker: 'tina',
 *         text: 'Let\'s test your investment knowledge! Question 1: ...',
 *         timestamp: Date.now(),
 *         intent: 'quiz',
 *       }];
 *     }
 *     return null;
 *   },
 *   destroy() {
 *     console.log('Quiz plugin destroyed');
 *   },
 * };
 *
 * companion.registerPlugin(quizPlugin);
 * ```
 */
