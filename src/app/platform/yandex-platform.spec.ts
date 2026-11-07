import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { YandexPlatform, YandexSdk } from './yandex-platform';

describe('YandexPlatform', () => {
  let platform: YandexPlatform;
  let sdk: YandexSdk;
  let init: ReturnType<typeof vi.fn>;
  let callbacks: Parameters<YandexSdk['adv']['showFullscreenAdv']>[0]['callbacks'];
  let events: Record<string, () => void>;

  beforeEach(() => {
    events = {};
    sdk = {
      features: { LoadingAPI: { ready: vi.fn() }, GameplayAPI: { start: vi.fn(), stop: vi.fn() } },
      adv: { showFullscreenAdv: vi.fn(options => { callbacks = options.callbacks; }) },
      on: vi.fn((event, callback) => { events[event] = callback; }),
    };
    init = vi.fn().mockResolvedValue(sdk);
    Object.defineProperty(window, 'YaGames', { configurable: true, value: { init } });
    platform = TestBed.inject(YandexPlatform);
  });

  afterEach(() => {
    delete (window as Window & { YaGames?: unknown }).YaGames;
    vi.restoreAllMocks();
  });

  it('initializes once and reports ready once', async () => {
    await Promise.all([platform.initialize(), platform.initialize()]);
    platform.ready();
    platform.ready();
    expect(init).toHaveBeenCalledTimes(1);
    expect(sdk.features.LoadingAPI.ready).toHaveBeenCalledTimes(1);
  });

  it('pauses until the ad closes and deduplicates overlapping requests', async () => {
    await platform.initialize();
    platform.setGameplay(true);
    const ad = platform.showInterstitial();
    expect(platform.showInterstitial()).toBe(ad);
    expect(platform.paused()).toBe(true);
    expect(sdk.features.GameplayAPI.stop).toHaveBeenCalledTimes(1);
    callbacks.onClose(true);
    await ad;
    expect(platform.paused()).toBe(false);
    expect(sdk.features.GameplayAPI.start).toHaveBeenCalledTimes(2);
    expect(sdk.adv.showFullscreenAdv).toHaveBeenCalledTimes(1);
  });

  it('unblocks the game when an ad errors, is offline, or is not shown', async () => {
    await platform.initialize();
    for (const finish of [() => callbacks.onError(new Error('No ad')), () => callbacks.onOffline(), () => callbacks.onClose(false)]) {
      const ad = platform.showInterstitial();
      finish();
      await ad;
      expect(platform.paused()).toBe(false);
    }
  });

  it('keeps a platform pause after an ad closes until the resume event', async () => {
    await platform.initialize();
    const ad = platform.showInterstitial();
    events['game_api_pause']();
    callbacks.onClose(true);
    await ad;
    expect(platform.paused()).toBe(true);
    events['game_api_resume']();
    expect(platform.paused()).toBe(false);
  });

  it('continues without ads if initialization fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    init.mockRejectedValue(new Error('Unavailable'));
    await platform.initialize();
    await platform.showInterstitial();
    expect(platform.paused()).toBe(false);
    expect(sdk.adv.showFullscreenAdv).not.toHaveBeenCalled();
  });
});
