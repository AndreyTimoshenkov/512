import { signal } from '@angular/core';
import type { GamePlatform } from './game-platform';

/** Default web build has no SDK or advertising requests. */
export function createPlatform(): GamePlatform {
  return {
    paused: signal(false).asReadonly(),
    initialize: () => Promise.resolve(),
    ready: () => undefined,
    setGameplay: () => undefined,
    showInterstitial: () => undefined,
  };
}
