'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import '@/voice-companion-sdk/styles.css';

export default function VoiceCompanionWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const companionRef = useRef<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    (async () => {
      try {
        const { VoiceCompanion } = await import('@/voice-companion-sdk');

        if (!mounted) return;

        const companion = await VoiceCompanion.create({
          defaultCharacter: 'abe',
          language: 'en',
          theme: 'dark',
          position: 'bottom-right',
          autoGreet: true,
          autoGreetDelay: 2500,
          enableTts: true,
          enableVoice: true,
          enableClaudeAI: false, // Set true with valid API key
          // claudeApiKey: 'YOUR_KEY_HERE',
          // claudeProxyUrl: '/api/claude-proxy',
          ttsProvider: 'auto',

          navigationHandler: (path: string) => {
            router.push(path);
          },

          actionHandler: (action: string, data?: string) => {
            switch (action) {
              case 'whatsapp':
                window.open('https://wa.me/917200255252', '_blank');
                break;
              case 'call':
                window.open('tel:+917200255252', '_self');
                break;
              case 'email':
                window.open('mailto:info@ghlindiaventures.com', '_self');
                break;
              case 'scroll':
                if (data === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
                else if (data === 'down') window.scrollBy({ top: 400, behavior: 'smooth' });
                break;
              case 'theme':
                document.documentElement.classList.toggle('dark');
                break;
              case 'quiz':
                router.push('/quiz');
                break;
              case 'calculator':
                router.push('/calculator');
                break;
              case 'search':
                // Trigger command palette
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                break;
              default:
                break;
            }
          },

          onReady: () => {
            console.log('[VoiceCompanion] SDK Ready');
          },

          onError: (error: Error) => {
            console.error('[VoiceCompanion] Error:', error.message);
          },
        });

        if (!mounted) {
          companion.destroy();
          return;
        }

        companionRef.current = companion;
      } catch (error) {
        console.error('[VoiceCompanion] Failed to initialize:', error);
      }
    })();

    return () => {
      mounted = false;
      companionRef.current?.destroy();
      companionRef.current = null;
      initRef.current = false;
    };
  }, [router]);

  // Update current page on route changes
  useEffect(() => {
    if (companionRef.current) {
      companionRef.current.updateCurrentPage(pathname);
    }
  }, [pathname]);

  // SDK manages its own DOM — no React rendering needed
  return null;
}
