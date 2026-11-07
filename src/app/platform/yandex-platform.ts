import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { GamePlatform } from './game-platform';

export interface YandexSdk {
  features: {
    LoadingAPI?: { ready(): void };
    GameplayAPI?: { start(): void; stop(): void };
  };
  adv: {
    showFullscreenAdv(options: { callbacks: {
      onOpen(): void;
      onClose(wasShown: boolean): void;
      onError(error: unknown): void;
      onOffline(): void;
    } }): void;
  };
  on(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
}

type YandexWindow = Window & { YaGames?: { init(): Promise<YandexSdk> } };

@Injectable({ providedIn: 'root' })
export class YandexPlatform implements GamePlatform {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private sdk?: YandexSdk;
  private initialization?: Promise<void>;
  private ad?: Promise<void>;
  private readonly adPending = signal(false);
  private readonly platformPaused = signal(false);
  private gameplayWanted = false;
  private gameplayActive = false;
  private readySent = false;
  readonly paused = signal(false);

  initialize(): Promise<void> {
    return this.initialization ??= this.load().catch(error => {
      console.warn('Yandex Games SDK unavailable; continuing without ads.', error);
    });
  }

  private async load(): Promise<void> {
    if (!this.browser) { return; }
    const window = this.document.defaultView as YandexWindow;
    if (!window.YaGames) {
      await new Promise<void>((resolve, reject) => {
        const script = this.document.createElement('script');
        const timer = setTimeout(() => {
          script.remove();
          reject(new Error('Yandex SDK loading timed out'));
        }, 10000);
        script.src = '/sdk.js';
        script.async = true;
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Yandex SDK failed to load')); };
        this.document.head.appendChild(script);
      });
    }
    let timer: ReturnType<typeof setTimeout>;
    try {
      this.sdk = await Promise.race([
        window.YaGames.init(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Yandex SDK initialization timed out')), 10000);
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
    this.sdk.on('game_api_pause', () => { this.platformPaused.set(true); this.sync(); });
    this.sdk.on('game_api_resume', () => { this.platformPaused.set(false); this.sync(); });
    this.document.addEventListener('visibilitychange', () => this.sync());
    this.sync();
  }

  ready(): void {
    if (!this.sdk || this.readySent) { return; }
    this.sdk.features.LoadingAPI?.ready();
    this.readySent = true;
  }

  setGameplay(active: boolean): void {
    this.gameplayWanted = active;
    this.sync();
  }

  private sync(): void {
    const paused = this.adPending() || this.platformPaused() || this.document.hidden;
    this.paused.set(paused);
    const active = this.gameplayWanted && !paused;
    if (!this.sdk || active === this.gameplayActive) { return; }
    this.gameplayActive = active;
    if (active) { this.sdk.features.GameplayAPI?.start(); }
    else { this.sdk.features.GameplayAPI?.stop(); }
  }

  showInterstitial(): Promise<void> {
    if (this.ad) { return this.ad; }
    if (!this.sdk) { return Promise.resolve(); }
    this.adPending.set(true);
    this.sync();
    this.ad = new Promise<void>(resolve => {
      const finish = () => { resolve(); };
      try {
        this.sdk!.adv.showFullscreenAdv({ callbacks: {
          onOpen: () => undefined,
          onClose: finish,
          onError: finish,
          onOffline: finish,
        } });
      } catch {
        finish();
      }
    }).finally(() => {
      this.adPending.set(false);
      this.ad = undefined;
      this.sync();
    });
    return this.ad;
  }
}
