import { InjectionToken, Signal } from '@angular/core';
import { createPlatform } from './platform.providers';

/** The game depends on capabilities, rather than any particular portal SDK. */
export interface GamePlatform {
  readonly paused: Signal<boolean>;
  initialize(): Promise<void>;
  ready(): void;
  setGameplay(active: boolean): void;
  showInterstitial(): Promise<void> | void;
}

export const GAME_PLATFORM = new InjectionToken<GamePlatform>('Game platform', {
  providedIn: 'root',
  factory: createPlatform,
});
