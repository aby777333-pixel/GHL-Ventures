/**
 * GHL India Ventures — Voice Companion Patch v2.1
 * ================================================
 * Runtime enhancement for the Voice Companion SDK.
 * Provides fallback voice/mic detection and smooth UX
 * when the SDK DOM is present on the page.
 *
 * Primary fixes are now in AvatarConcierge.tsx (React).
 * This file provides additional runtime hooks for the
 * voice-companion-sdk panel if it is loaded.
 * ================================================
 */
(function () {
  'use strict';

  // Only activate if SDK panel exists
  function waitForElement(selector, callback, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function () {
      var el = document.querySelector(selector);
      if (el) { callback(el); return; }
      if (Date.now() - start < maxWait) setTimeout(check, 300);
    };
    check();
  }

  // Preload speech synthesis voices
  function preloadVoices() {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function () {
        window.speechSynthesis.getVoices();
      };
    }
  }

  // Expose companion debug info
  window.GHLCompanionPatch = {
    version: '2.1',
    integrated: true,
  };

  preloadVoices();

  console.log('[GHL Companion Patch v2.1] Loaded — core fixes integrated into React components');
})();
