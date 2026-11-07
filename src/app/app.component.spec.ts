import { signal } from '@angular/core';
import { GAME_PLATFORM, GamePlatform } from './platform/game-platform';
import { vi, type Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { SwipeDirective } from './directives/swipe.directive';
import { EDirection } from './interfaces/general.types';
import { AppComponent } from './app.component';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { EPerk } from './interfaces/perk.types';

describe('AppComponent', () => {
  let storage: Mocked<Pick<LocalStorageService, keyof LocalStorageService>>;

  beforeEach(async () => {
    storage = {
      getState: vi.fn<LocalStorageService['getState']>().mockReturnValue([]),
      getTurn: vi.fn<LocalStorageService['getTurn']>().mockReturnValue(1),
      getScore: vi.fn<LocalStorageService['getScore']>().mockReturnValue(0),
      getTarget: vi.fn<LocalStorageService['getTarget']>().mockReturnValue(512),
      getPerks: vi.fn<LocalStorageService['getPerks']>().mockReturnValue(null),
      getLocale: vi.fn<LocalStorageService['getLocale']>().mockReturnValue(null),
      getIntroSeen: vi.fn<LocalStorageService['getIntroSeen']>().mockReturnValue(true),
      saveIntroSeen: vi.fn(),
      saveState: vi.fn(),
      savePerks: vi.fn(),
      saveTurn: vi.fn(),
      saveScore: vi.fn(),
      saveTarget: vi.fn(),
      saveLocale: vi.fn(),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [{ provide: LocalStorageService, useValue: storage }],
    }).compileComponents();
  });

  it('keeps the board and blocks moves until the interstitial finishes', async () => {
    let closeAd!: () => void;
    const platform: GamePlatform = {
      paused: signal(false),
      initialize: () => Promise.resolve(),
      ready: vi.fn(),
      setGameplay: vi.fn(),
      showInterstitial: vi.fn(() => new Promise<void>(resolve => { closeAd = resolve; })),
    };
    TestBed.overrideProvider(GAME_PLATFORM, { useValue: platform });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    const previous = app.state$$();
    const restart = app.startNewGame();
    await app.startNewGame();
    app.move(EDirection.right);
    expect(app.state$$()).toBe(previous);
    expect(app.startingNewGame()).toBe(true);
    expect(platform.showInterstitial).toHaveBeenCalledTimes(1);
    closeAd();
    await restart;
    expect(app.state$$()).not.toBe(previous);
    expect(app.startingNewGame()).toBe(false);
    expect(app.turn$$()).toBe(1);
  });

  it('starts a new game with sixteen cells and two initial tiles', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.state$$().length).toBe(16);
    expect(app.state$$().filter(cell => cell.value === 2).length).toBe(2);
    expect(app.turn$$()).toBe(1);
    expect(app.score$$()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('grid-cell').length).toBe(16);
    expect(fixture.nativeElement.querySelectorAll('grid-cell.has-value').length).toBe(2);
  });

  it('restores the saved board, turn and score in the scoreboard', async () => {
    const state = Array.from({ length: 16 }, (_, key) => ({ key, value: key === 0 ? 8 : 0 }));
    storage.getState.mockReturnValue(state);
    storage.getTurn.mockReturnValue(7);
    storage.getScore.mockReturnValue(24);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.state$$()).toEqual(state);
    expect(app.turn$$()).toBe(7);
    expect(app.score$$()).toBe(24);
    const scoreboard = fixture.nativeElement.querySelector('.scoreboard_text') as HTMLElement;
    expect(scoreboard.textContent).toContain('TURN 7');
    expect(scoreboard.textContent).toContain('SCORE 24');
    expect(fixture.nativeElement.querySelector('grid-cell .value').textContent).toContain('8');
  });

  const board = (values: number[]) => values.map((value, key) => ({ key, value }));
  const stuck = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];

  it('keeps playing on a full board that still has a merge', async () => {
    storage.getState.mockReturnValue(board([2, 2, ...stuck.slice(2)]));
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.isLost()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-game-panel')).toBeNull();
  });

  it('shows the game over panel when no move is left and restarts from it', async () => {
    storage.getState.mockReturnValue(board(stuck));
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('app-game-panel h2').textContent).toContain('GAME_OVER');

    storage.getState.mockReturnValue([]);
    fixture.nativeElement.querySelector('app-game-panel button').click();
    fixture.detectChanges();
    expect(storage.clear).toHaveBeenCalled();
    expect(app.isLost()).toBe(false);
    expect(app.state$$().filter(cell => cell.value).length).toBe(2);
  });

  it('asks before abandoning a game and blocks moves while asking', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    const before = structuredClone(app.state$$());
    app.restartGame();
    fixture.detectChanges();
    expect(storage.clear).not.toHaveBeenCalled();
    for (const direction of Object.values(EDirection)) { app.move(direction); }
    expect(app.state$$()).toEqual(before);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-game-panel')).toBeNull();
  });

  it('celebrates only the move that makes 512', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.state$$.set(board([256, 256, ...Array(14).fill(0)]));
    app.move(EDirection.left);
    expect(app.wonOpen()).toBe(true);
    app.closePanels();
    app.move(EDirection.right);
    expect(app.wonOpen()).toBe(false);
  });

  it('slides moving tiles over the board and holds the landing cell until they arrive', async () => {
    vi.useFakeTimers();
    try {
      storage.getState.mockReturnValue(board([2, 2, 0, 0, 8, ...Array(11).fill(0)]));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const app = fixture.componentInstance;

      app.move(EDirection.right);
      expect(app.pace()).toBe(1);
      fixture.detectChanges();
      const slides = [...fixture.nativeElement.querySelectorAll('grid-cell.slide')] as HTMLElement[];
      expect(slides.length).toBe(3);
      expect(slides.map(slide => slide.style.getPropertyValue('--slide-columns'))).toEqual(['3', '2', '3']);
      expect(app.landing().has(3)).toBe(true);
      expect(app.merged().has(3)).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('grid-cell')[3].textContent).not.toContain('4');

      vi.advanceTimersByTime(app.slideMs);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('grid-cell.slide')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('grid-cell')[3].textContent).toContain('4');
    } finally {
      vi.useRealTimers();
    }
  });

  it('plays a chain merge one step at a time, with the spawn and the panels last', async () => {
    vi.useFakeTimers();
    try {
      storage.getState.mockReturnValue(board([2, 2, 4, 8, ...Array(12).fill(0)]));
      storage.getTarget.mockReturnValue(16);
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const app = fixture.componentInstance;
      const slideMs = app.slideMs * app.chainPace;
      const popMs = app.popMs * app.chainPace;
      const shown = () => app.board().slice(0, 4).map(cell => cell.value);

      app.move(EDirection.left);
      expect(app.pace()).toBe(app.chainPace);
      expect(app.state$$()[0].value).toBe(16);
      expect(app.wonOpen()).toBe(true);
      expect(shown()).toEqual([4, 4, 8, 0]);
      expect(app.merged().has(0)).toBe(true);
      expect(app.board().filter(cell => cell.value).length).toBe(3);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-game-panel')).toBeNull();

      vi.advanceTimersByTime(slideMs + popMs);
      expect(app.merged().size).toBe(0);
      expect(shown()).toEqual([4, 4, 8, 0]);

      vi.advanceTimersByTime(app.stagePauseMs);
      expect(shown()).toEqual([8, 8, 0, 0]);
      expect(app.merged().has(0)).toBe(true);

      vi.advanceTimersByTime(slideMs + popMs + app.stagePauseMs);
      expect(shown()).toEqual([16, 0, 0, 0]);
      expect(app.frame()).not.toBeNull();

      vi.advanceTimersByTime(slideMs);
      expect(app.frame()).toBeNull();
      expect(app.board().filter(cell => cell.value).length).toBe(2);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-game-panel')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps long slides on big boards at the speed of a short board', () => {
    vi.useFakeTimers();
    try {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([2, ...Array(35).fill(0)]));
      app.move(EDirection.right);
      expect(app.slideTime()).toBeCloseTo(app.slideMs * 5 / app.slideCells);

      vi.advanceTimersByTime(app.slideMs);
      expect(app.slides().length).toBe(1);
      vi.advanceTimersByTime(app.slideTime() - app.slideMs);
      expect(app.slides().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not stretch slides that fit the usual distance', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.state$$.set(board([0, 2, ...Array(34).fill(0)]));
    app.move(EDirection.left);
    expect(app.slideTime()).toBe(app.slideMs);
  });

  it('jumps to the next move when one comes in mid-chain', () => {
    vi.useFakeTimers();
    // Spawns land in the last empty cell, out of the 16's way.
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    try {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([2, 2, 4, 8, ...Array(12).fill(0)]));
      app.move(EDirection.left);
      app.move(EDirection.down);
      expect(app.board()[12].value).toBe(16);
      vi.runAllTimers();
      expect(app.frame()).toBeNull();
      expect(app.board()).toEqual(app.state$$());
    } finally {
      random.mockRestore();
      vi.useRealTimers();
    }
  });

  it('skips the slide when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.state$$.set(board([2, 2, ...Array(14).fill(0)]));
    app.move(EDirection.right);
    vi.unstubAllGlobals();
    expect(app.slides()).toEqual([]);
    expect(app.landing().size).toBe(0);
    expect(app.frame()).toBeNull();
    expect(app.state$$()[3].value).toBe(4);
  });

  it('saves the board after a move', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    app.state$$.set(board([2, ...Array(15).fill(0)]));
    app.move(EDirection.right);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(storage.saveState).toHaveBeenLastCalledWith(app.state$$());
    expect(storage.saveTurn).toHaveBeenLastCalledWith(app.turn$$());
  });

  describe('first play intro', () => {
    const open = async () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };
    const heading = (fixture: ReturnType<typeof TestBed.createComponent<AppComponent>>) =>
      fixture.nativeElement.querySelector('app-intro h2')?.textContent;

    beforeEach(() => storage.getIntroSeen.mockReturnValue(false));

    it('walks through the steps, blocking moves, and is not shown again', async () => {
      const fixture = await open();
      const app = fixture.componentInstance;
      expect(heading(fixture)).toContain('INTRO_MOVE_TITLE');
      const state = app.state$$();
      app.move(EDirection.right);
      app.move(EDirection.left);
      expect(app.state$$()).toBe(state);

      fixture.nativeElement.querySelector('app-intro button').click();
      fixture.detectChanges();
      expect(heading(fixture)).toContain('INTRO_MERGE_TITLE');
      expect(fixture.nativeElement.querySelector('app-perk-tray.spotlight')).toBeNull();

      fixture.nativeElement.querySelector('app-intro button').click();
      fixture.detectChanges();
      expect(heading(fixture)).toContain('INTRO_PERKS_TITLE');
      expect(fixture.nativeElement.querySelector('app-perk-tray.spotlight')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('app-tile-ladder.spotlight')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('app-intro button').length).toBe(1);
      expect(storage.saveIntroSeen).not.toHaveBeenCalled();

      fixture.nativeElement.querySelector('app-intro button').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-intro')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-perk-tray.spotlight')).toBeNull();
      expect(storage.saveIntroSeen).toHaveBeenCalledTimes(1);
    });

    it('names the running game\'s target, not the default one', async () => {
      TestBed.inject(TranslateService).setTranslation('en', { INTRO_MERGE: 'reach {{target}}' });
      storage.getState.mockReturnValue(board([2, 2, ...Array(14).fill(0)]));
      storage.getTarget.mockReturnValue(2048);
      const fixture = await open();
      fixture.nativeElement.querySelector('app-intro button').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-intro p').textContent).toContain('reach 2048');
    });

    it('can be skipped or dismissed with Escape', async () => {
      const skipped = await open();
      skipped.nativeElement.querySelectorAll('app-intro button')[1].click();
      skipped.detectChanges();
      expect(skipped.nativeElement.querySelector('app-intro')).toBeNull();
      expect(storage.saveIntroSeen).toHaveBeenCalledTimes(1);

      const escaped = await open();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      escaped.detectChanges();
      expect(escaped.nativeElement.querySelector('app-intro')).toBeNull();
    });

    it('is shown again to a player who left without moving, but not mid-game', async () => {
      storage.getState.mockReturnValue(board([2, 2, ...Array(14).fill(0)]));
      expect(heading(await open())).toContain('INTRO_MOVE_TITLE');

      storage.getTurn.mockReturnValue(5);
      expect(heading(await open())).toBeUndefined();
    });

    it('stays away once seen', async () => {
      storage.getIntroSeen.mockReturnValue(true);
      expect(heading(await open())).toBeUndefined();
    });
  });

  describe('perk effects', () => {
    type TFixture = ReturnType<typeof TestBed.createComponent<AppComponent>>;
    const shown = (values: number[]) => board(values);
    const give = (app: AppComponent, perk: EPerk) =>
      app.perks$$.update(perks => ({ ...perks, inventory: { ...perks.inventory, [perk]: 1 } }));
    const stamp = (fixture: TFixture) => fixture.nativeElement.querySelector('app-perk-effect');
    const start = async (values: number[]) => {
      storage.getState.mockReturnValue(shown(values));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      vi.useFakeTimers();
      return fixture;
    };

    afterEach(() => vi.useRealTimers());

    it('gives every perk an effect that clears itself', async () => {
      const values = [2, 4, 8, 16, ...Array(12).fill(0)];
      const uses: [EPerk, (app: AppComponent) => void][] = [
        [EPerk.double, app => app.usePerk(EPerk.double)],
        [EPerk.save, app => app.usePerk(EPerk.save)],
        [EPerk.sweep, app => app.usePerk(EPerk.sweep)],
        [EPerk.shuffle, app => app.usePerk(EPerk.shuffle)],
        [EPerk.hammer, app => { app.usePerk(EPerk.hammer); app.pickTile(0); }],
        [EPerk.upgrade, app => { app.usePerk(EPerk.upgrade); app.pickTile(0); }],
        [EPerk.swap, app => { app.usePerk(EPerk.swap); app.pickTile(0); app.pickTile(1); }],
      ];
      for (const [perk, use] of uses) {
        const fixture = await start(values);
        const app = fixture.componentInstance;
        give(app, perk);
        use(app);
        fixture.detectChanges();
        expect(stamp(fixture).getAttribute('data-fx')).toBe(perk);
        expect(fixture.nativeElement.querySelector('grid-container').getAttribute('data-fx')).toBe(perk);

        vi.advanceTimersByTime(2000);
        fixture.detectChanges();
        expect(stamp(fixture)).toBeNull();
        expect(app.frame()).toBeNull();
        vi.useRealTimers();
      }
    });

    it('rewinds on undo and on reloading a save', async () => {
      const fixture = await start([2, 2, ...Array(14).fill(0)]);
      const app = fixture.componentInstance;
      give(app, EPerk.save);
      app.usePerk(EPerk.save);
      app.move(EDirection.left);
      give(app, EPerk.undo);
      app.usePerk(EPerk.undo);
      fixture.detectChanges();
      expect(stamp(fixture).getAttribute('data-fx')).toBe(EPerk.undo);
      expect(app.merged().size).toBeGreaterThan(0);

      app.move(EDirection.left);
      app.loadSave();
      fixture.detectChanges();
      expect(stamp(fixture).getAttribute('data-fx')).toBe('LOAD');
      expect(stamp(fixture).querySelector('app-perk-icon')).not.toBeNull();
    });

    it('keeps smashed and swept tiles on screen while they leave', async () => {
      const fixture = await start([2, 4, 8, 2, ...Array(12).fill(0)]);
      const app = fixture.componentInstance;
      give(app, EPerk.sweep);
      app.usePerk(EPerk.sweep);
      fixture.detectChanges();
      expect(app.exits()).toEqual([
        { value: 2, row: 0, column: 0 },
        { value: 4, row: 0, column: 1 },
        { value: 2, row: 0, column: 3 },
      ]);
      expect(fixture.nativeElement.querySelectorAll('grid-cell.exit--swept').length).toBe(3);
      expect(app.state$$().filter(cell => cell.value).length).toBe(1);

      vi.advanceTimersByTime(app.effectMs);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('grid-cell.exit').length).toBe(0);
    });

    it('does not treat shuffled tiles as removed, even when their cell ends up empty', async () => {
      const fixture = await start([2, 4, 8, 16, ...Array(12).fill(0)]);
      const app = fixture.componentInstance;
      give(app, EPerk.shuffle);
      app.usePerk(EPerk.shuffle);
      expect(app.slides().length).toBeGreaterThan(0);
      expect(app.exits()).toEqual([]);
    });

    it('slides swapped and shuffled tiles to where they end up', async () => {
      const fixture = await start([2, 4, ...Array(14).fill(0)]);
      const app = fixture.componentInstance;
      give(app, EPerk.swap);
      app.usePerk(EPerk.swap);
      app.pickTile(0);
      app.pickTile(1);
      expect(app.slides()).toEqual([
        { value: 4, row: 0, column: 1, rows: 0, columns: -1 },
        { value: 2, row: 0, column: 0, rows: 0, columns: 1 },
      ]);
      expect(app.pace()).toBe(app.perkPace);
      expect(app.state$$().slice(0, 2).map(cell => cell.value)).toEqual([4, 2]);
    });

    it('stops at once when the next move starts', async () => {
      const fixture = await start([2, 4, 8, 16, ...Array(12).fill(0)]);
      const app = fixture.componentInstance;
      give(app, EPerk.double);
      app.usePerk(EPerk.double);
      app.move(EDirection.down);
      expect(app.effects()).toEqual([]);
    });
  });

  describe('perk hints', () => {
    type TFixture = ReturnType<typeof TestBed.createComponent<AppComponent>>;
    const firstTier = [EPerk.double, EPerk.swap, EPerk.hammer];
    const title = (fixture: TFixture) => fixture.nativeElement.querySelector('app-intro h2')?.textContent;
    const icons = (fixture: TFixture) => fixture.nativeElement.querySelectorAll('app-intro app-perk-icon').length;
    const lit = (fixture: TFixture) => fixture.nativeElement.querySelectorAll('app-perk-tray .highlighted').length;
    const next = (fixture: TFixture) => {
      fixture.nativeElement.querySelector('app-intro button').click();
      fixture.detectChanges();
    };
    const settle = (fixture: TFixture) => {
      vi.advanceTimersByTime(1000);
      fixture.detectChanges();
    };
    const playTo = (fixture: TFixture, values: number[]) => {
      fixture.componentInstance.state$$.set(board(values));
      fixture.componentInstance.move(EDirection.left);
      fixture.detectChanges();
    };
    const pair = (value: number) => [value, value, ...Array(14).fill(0)];

    const start = async () => {
      storage.getState.mockReturnValue(board(pair(2)));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      vi.useFakeTimers();
      return fixture;
    };

    afterEach(() => vi.useRealTimers());

    it('waits for the move, announces the new perks, then explains each one', async () => {
      TestBed.inject(TranslateService).setTranslation('en', { PERK_EARNED_TEXT: 'reached {{tile}}' });
      const fixture = await start();
      playTo(fixture, pair(32));
      expect(title(fixture)).toBeUndefined();
      settle(fixture);

      expect(title(fixture)).toContain('PERK_EARNED_TITLE');
      expect(fixture.nativeElement.querySelector('app-intro p').textContent).toContain('reached 64');
      expect(icons(fixture)).toBe(3);
      expect(lit(fixture)).toBe(3);
      next(fixture);

      for (const perk of firstTier) {
        expect(title(fixture)).toContain(`PERK_${perk}`);
        expect(fixture.nativeElement.querySelector('app-intro p').textContent).toContain(`PERK_${perk}_INFO`);
        expect(icons(fixture)).toBe(1);
        expect(lit(fixture)).toBe(1);
        expect(fixture.componentInstance.panelOpen()).toBe(true);
        if (perk === EPerk.hammer) {
          expect(fixture.nativeElement.querySelector('app-intro button').textContent).toContain('KEEP_PLAYING');
        }
        next(fixture);
      }

      expect(fixture.nativeElement.querySelector('app-intro')).toBeNull();
      expect(lit(fixture)).toBe(0);
    });

    it('comes back at every milestone', async () => {
      const fixture = await start();
      for (const [tile, count] of [[32, 3], [64, 3], [128, 2]]) {
        playTo(fixture, pair(tile));
        settle(fixture);
        expect(title(fixture)).toContain('PERK_EARNED_TITLE');
        expect(icons(fixture)).toBe(count);
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();
        expect(title(fixture)).toBeUndefined();
      }
    });

    it('comes back for the same milestone in the next game', async () => {
      const fixture = await start();
      playTo(fixture, pair(32));
      settle(fixture);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      fixture.componentInstance.state$$.set([]);
      storage.getState.mockReturnValue([]);
      fixture.componentInstance.startNewGame();
      fixture.detectChanges();
      playTo(fixture, pair(32));
      settle(fixture);
      expect(title(fixture)).toContain('PERK_EARNED_TITLE');
    });

    it('stays away when a move reaches no milestone', async () => {
      const fixture = await start();
      playTo(fixture, pair(16));
      settle(fixture);
      expect(title(fixture)).toBeUndefined();
    });

    it('comes before the game-over panel when the same move ends the game', async () => {
      const fixture = await start();
      playTo(fixture, [32, 32, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4]);
      settle(fixture);
      expect(title(fixture)).toContain('PERK_EARNED_TITLE');
      expect(fixture.nativeElement.querySelector('app-game-panel h2').textContent).not.toContain('GAME_OVER');
    });
  });

  it('makes the controls behind an open panel inert and hands focus back on closing', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector('.scoreboard button') as HTMLElement;
    opener.focus();

    opener.click();
    fixture.detectChanges();
    const panelButton = fixture.nativeElement.querySelector('app-game-panel button');
    expect(document.activeElement).toBe(panelButton);
    expect(fixture.nativeElement.querySelector('.tools').hasAttribute('inert')).toBe(true);
    expect(fixture.nativeElement.querySelector('.scoreboard').hasAttribute('inert')).toBe(true);

    panelButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tools').hasAttribute('inert')).toBe(false);
    expect(fixture.nativeElement.querySelector('.scoreboard').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
    fixture.nativeElement.remove();
  });

  it('drops an unfinished slide when a new game starts', () => {
    vi.useFakeTimers();
    try {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([2, 2, ...Array(14).fill(0)]));
      app.move(EDirection.right);
      expect(app.slides().length).toBe(2);

      storage.getState.mockReturnValue([]);
      app.startNewGame();
      expect(app.slides()).toEqual([]);
      expect(app.landing().size).toBe(0);
      expect(app.merged().size).toBe(0);
      expect(app.spawned().size).toBe(2);
      vi.runAllTimers();
      expect(app.spawned().size).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts the next game with the chosen target and grid', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;

    app.restartGame();
    fixture.detectChanges();
    const radios = [...fixture.nativeElement.querySelectorAll('app-game-setup input')] as HTMLInputElement[];
    expect(radios.filter(radio => radio.checked).map(radio => radio.value)).toEqual(['512', '4']);
    radios.find(radio => radio.value === '2048')!.click();
    radios.find(radio => radio.value === '6')!.click();
    expect(app.size()).toBe(4);

    app.startNewGame();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(app.target$$()).toBe(2048);
    expect(app.size()).toBe(6);
    expect(app.state$$().length).toBe(36);
    expect(app.state$$().filter(cell => cell.value).length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('grid-cell').length).toBe(36);
    expect(fixture.nativeElement.querySelector('app-tile-ladder').textContent).toContain('2048');
    expect(storage.saveTarget).toHaveBeenLastCalledWith(2048);
  });

  it('forgets unconfirmed choices when the player keeps playing', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.state$$.set(board(Array(16).fill(0)));
    app.setupTarget.set(1024);
    app.setupSize.set(5);
    app.closePanels();
    expect(app.setupTarget()).toBe(512);
    expect(app.setupSize()).toBe(4);
  });

  it('restores the target and grid of a saved game', async () => {
    storage.getState.mockReturnValue(board([4, ...Array(24).fill(0)]));
    storage.getTarget.mockReturnValue(1024);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.size()).toBe(5);
    expect(fixture.componentInstance.target$$()).toBe(1024);
  });

  it('wins at the chosen target, not at 512', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.target$$.set(1024);
    app.state$$.set(board([256, 256, ...Array(14).fill(0)]));
    app.move(EDirection.left);
    expect(app.wonOpen()).toBe(false);
    app.finishIntro();
    app.state$$.set(board([512, 512, ...Array(14).fill(0)]));
    app.move(EDirection.left);
    expect(app.wonOpen()).toBe(true);
  });

  it('slides across a larger grid with the right distances', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.state$$.set(board([0, 0, 0, 0, 0, 0, 2, ...Array(29).fill(0)]));
    app.move(EDirection.right);
    expect(app.state$$()[11].value).toBe(2);
    expect(app.slides()[0]).toEqual({ value: 2, row: 1, column: 0, rows: 0, columns: 5 });
  });

  it('charges one point per move on top of the merge points', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    const play = (values: number[]) => {
      app.score$$.set(10);
      app.state$$.set(board([...values, ...Array(12).fill(0)]));
      app.move(EDirection.left);
      return app.score$$() - 10;
    };
    expect(play([0, 2, 0, 0])).toBe(-1);
    expect(play([2, 2, 0, 0])).toBe(0);
    expect(play([4, 4, 0, 0])).toBe(1);
    expect(play([256, 256, 0, 0])).toBe(7);

    app.wonOpen.set(false);
    expect(play([2, 0, 0, 0])).toBe(0);
  });

  describe('perks', () => {
    const give = (app: AppComponent, perk: EPerk, count = 1) =>
      app.perks$$.update(perks => ({ ...perks, inventory: { ...perks.inventory, [perk]: count } }));
    const values = (app: AppComponent) => app.state$$().map(cell => cell.value);

    it('earns nothing on the way to the first tier, then the whole tier once', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([16, 16, ...Array(14).fill(0)]));
      app.move(EDirection.left);
      expect(app.hint()).toBeNull();
      expect(app.perks$$().inventory[EPerk.double]).toBe(0);

      app.state$$.set(board([32, 32, ...Array(14).fill(0)]));
      app.move(EDirection.left);
      expect(app.hint()).toEqual({ key: 'PERK_EARNED', tile: 64 });
      for (const perk of [EPerk.double, EPerk.swap, EPerk.hammer]) {
        expect(app.perks$$().inventory[perk]).toBe(1);
      }
      expect(app.perks$$().inventory[EPerk.shuffle]).toBe(0);

      app.state$$.set(board([32, 32, ...Array(14).fill(0)]));
      app.move(EDirection.left);
      expect(app.perks$$().inventory[EPerk.double]).toBe(1);
    });

    it('scales the tiers with the target', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.target$$.set(2048);
      expect(app.rewardTiles()).toEqual([256, 512, 1024]);

      app.state$$.set(board([32, 32, ...Array(14).fill(0)]));
      app.move(EDirection.left);
      expect(app.perks$$().inventory[EPerk.double]).toBe(0);

      app.state$$.set(board([128, 128, ...Array(14).fill(0)]));
      app.move(EDirection.left);
      expect(app.perks$$().inventory[EPerk.double]).toBe(1);
    });

    it('rings the reward tiles still ahead on the ladder', async () => {
      storage.getState.mockReturnValue(board([64, ...Array(15).fill(0)]));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const ringed = [...fixture.nativeElement.querySelectorAll('.step.reward')] as HTMLElement[];
      expect(ringed.map(step => step.textContent)).toEqual(['128', '256']);
    });

    it('undo restores the board, score, turn and perks, and replays the same new tile', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      const start = board([32, 32, ...Array(14).fill(0)]);
      app.state$$.set(structuredClone(start));
      app.score$$.set(10);
      app.move(EDirection.left);
      const afterMove = structuredClone(app.state$$());
      expect(app.perks$$().inventory[EPerk.double]).toBe(1);
      app.finishIntro();

      app.usePerk(EPerk.undo);
      expect(app.state$$()).toEqual(start);
      expect(app.score$$()).toBe(10);
      expect(app.turn$$()).toBe(1);
      expect(app.perks$$().inventory[EPerk.undo]).toBe(0);
      expect(app.perks$$().inventory[EPerk.double]).toBe(0);

      app.move(EDirection.left);
      expect(app.state$$()).toEqual(afterMove);
    });

    it('allows only one undo per move', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([0, 2, ...Array(14).fill(0)]));
      give(app, EPerk.undo, 3);
      app.move(EDirection.left);
      app.usePerk(EPerk.undo);
      app.usePerk(EPerk.undo);
      expect(app.perks$$().inventory[EPerk.undo]).toBe(2);
    });

    it('doubles merge points for five moves without doubling the move cost', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([8, 8, ...Array(14).fill(0)]));
      app.score$$.set(10);
      give(app, EPerk.double);
      app.usePerk(EPerk.double);
      expect(app.perks$$().doubleMoves).toBe(5);
      expect(app.perks$$().inventory[EPerk.double]).toBe(0);

      app.move(EDirection.left);
      expect(app.score$$()).toBe(15);
      expect(app.perks$$().doubleMoves).toBe(4);
    });

    it('settles a chain before a tile perk takes aim, so the board shows the tiles it picks from', () => {
      vi.useFakeTimers();
      try {
        const app = TestBed.createComponent(AppComponent).componentInstance;
        app.state$$.set(board([2, 2, 4, 8, ...Array(12).fill(0)]));
        give(app, EPerk.hammer);
        app.move(EDirection.left);
        expect(app.board()[0].value).toBe(4);

        app.usePerk(EPerk.hammer);
        expect(app.frame()).toBeNull();
        expect(app.board()[0].value).toBe(16);
        expect(app.slides()).toEqual([]);
        expect(app.landing().size).toBe(0);
        expect(app.merged().size).toBe(0);

        vi.runAllTimers();
        expect(app.frame()).toBeNull();
        expect(app.board()[0].value).toBe(16);
      } finally {
        vi.useRealTimers();
      }
    });

    it('lets a chain play on when a perk needs no tile', () => {
      vi.useFakeTimers();
      try {
        const app = TestBed.createComponent(AppComponent).componentInstance;
        app.state$$.set(board([2, 2, 4, 8, ...Array(12).fill(0)]));
        give(app, EPerk.double);
        app.move(EDirection.left);

        app.usePerk(EPerk.double);
        expect(app.frame()).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('hammers the picked tile and spends the perk without using a turn', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([8, 2, ...Array(14).fill(0)]));
      give(app, EPerk.hammer);
      app.usePerk(EPerk.hammer);
      expect(app.targetPerk()).toBe(EPerk.hammer);
      expect(app.pickable().has(0)).toBe(true);

      app.pickTile(5);
      expect(app.targetPerk()).toBe(EPerk.hammer);
      app.pickTile(0);
      expect(values(app).slice(0, 2)).toEqual([0, 2]);
      expect(app.perks$$().inventory[EPerk.hammer]).toBe(0);
      expect(app.turn$$()).toBe(1);
      expect(app.targetPerk()).toBeNull();
    });

    it('swaps in two picks and can be cancelled without spending it', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([2, 4, ...Array(14).fill(0)]));
      give(app, EPerk.swap);

      app.usePerk(EPerk.swap);
      app.pickTile(0);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(app.targetPerk()).toBeNull();
      expect(app.swapFirst()).toBeNull();
      expect(app.perks$$().inventory[EPerk.swap]).toBe(1);

      app.usePerk(EPerk.swap);
      app.pickTile(0);
      app.pickTile(1);
      expect(values(app).slice(0, 2)).toEqual([4, 2]);
      expect(app.perks$$().inventory[EPerk.swap]).toBe(0);
    });

    describe('save', () => {
      const saveThenLose = async () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const app = fixture.componentInstance;
        app.state$$.set(board([8, 2, ...Array(14).fill(0)]));
        app.score$$.set(40);
        app.turn$$.set(20);
        give(app, EPerk.save, 2);
        give(app, EPerk.hammer, 1);
        app.usePerk(EPerk.save);
        return { fixture, app };
      };

      it('keeps a checkpoint and spends the perk', async () => {
        const { app } = await saveThenLose();
        expect(app.perks$$().inventory[EPerk.save]).toBe(1);
        expect(app.perks$$().save?.score).toBe(40);
        expect(app.hint()).toEqual({ key: 'PERK_SAVE_DONE' });
      });

      it('reloads the save from the game-over panel, restoring the whole game, only once', async () => {
        const { fixture, app } = await saveThenLose();
        const snapshot = structuredClone(app.state$$());
        app.usePerk(EPerk.hammer);
        app.pickTile(1);
        app.state$$.set(board(stuck));
        app.score$$.set(90);
        app.turn$$.set(60);
        fixture.detectChanges();

        const buttons = [...fixture.nativeElement.querySelectorAll('app-game-panel button')] as HTMLElement[];
        expect(buttons[0].textContent).toContain('LOAD_SAVE');
        expect(buttons[1].classList.contains('block-button--quiet')).toBe(true);

        buttons[0].click();
        fixture.detectChanges();
        expect(app.state$$()).toEqual(snapshot);
        expect(app.score$$()).toBe(40);
        expect(app.turn$$()).toBe(20);
        expect(app.perks$$().inventory[EPerk.hammer]).toBe(1);
        expect(app.perks$$().inventory[EPerk.save]).toBe(1);
        expect(app.perks$$().save).toBeNull();
        expect(fixture.nativeElement.querySelector('app-game-panel')).toBeNull();
      });

      it('offers no reload without a save', async () => {
        storage.getState.mockReturnValue(board(stuck));
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-game-panel').textContent).not.toContain('LOAD_SAVE');
        fixture.componentInstance.loadSave();
        expect(fixture.componentInstance.isLost()).toBe(true);
      });

      it('replaces an older save and cannot be used once the game is lost', async () => {
        const { app } = await saveThenLose();
        app.score$$.set(55);
        app.usePerk(EPerk.save);
        expect(app.perks$$().save?.score).toBe(55);

        app.state$$.set(board(stuck));
        give(app, EPerk.save, 1);
        app.usePerk(EPerk.save);
        expect(app.perks$$().inventory[EPerk.save]).toBe(1);
        expect(app.perks$$().save?.score).toBe(55);
      });

      it('survives moves and a new game clears it', async () => {
        const { app } = await saveThenLose();
        app.move(EDirection.down);
        expect(app.perks$$().save?.turn).toBe(20);

        app.startNewGame();
        expect(app.perks$$().save).toBeNull();
      });
    });

    it('explains a perk that cannot be used yet instead of using it', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([2, 4, ...Array(14).fill(0)]));
      app.usePerk(EPerk.sweep);
      expect(app.hint()).toEqual({ key: 'PERK_LOCKED', name: 'PERK_SWEEP_INFO', tile: 128 });
      expect(app.targetPerk()).toBeNull();
    });

    it('rescues a lost game: the tray stays usable and hides the panel while aiming', async () => {
      storage.getState.mockReturnValue(board(stuck));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const app = fixture.componentInstance;
      give(app, EPerk.hammer);
      fixture.detectChanges();
      expect(app.canRescue()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-perk-tray').hasAttribute('inert')).toBe(false);
      expect(fixture.nativeElement.querySelector('app-game-panel').getAttribute('aria-modal')).toBe('false');

      app.usePerk(EPerk.hammer);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-game-panel')).toBeNull();

      app.pickTile(0);
      fixture.detectChanges();
      expect(app.isLost()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-game-panel')).toBeNull();
    });

    describe('before the game ends', () => {
      const lose = async (...perks: EPerk[]) => {
        storage.getState.mockReturnValue(board(stuck));
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        perks.forEach(perk => give(fixture.componentInstance, perk));
        fixture.detectChanges();
        return fixture;
      };
      const panel = (fixture: ReturnType<typeof lose> extends Promise<infer T> ? T : never) =>
        fixture.nativeElement.querySelector('app-game-panel') as HTMLElement;
      const buttons = (fixture: Parameters<typeof panel>[0]) => [...panel(fixture).querySelectorAll('button')] as HTMLElement[];

      it('offers the usable perks instead of a new game', async () => {
        const fixture = await lose(EPerk.hammer, EPerk.shuffle);
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('NO_MOVES');
        expect(panel(fixture).textContent).toContain('PERK_RESCUE');
        expect(panel(fixture).querySelectorAll('app-rescue-perks button').length).toBe(2);
        expect(panel(fixture).textContent).not.toContain('NEW_GAME');
        expect(panel(fixture).querySelector('app-game-setup')).toBeNull();
        expect(fixture.nativeElement.querySelector('.scoreboard').hasAttribute('inert')).toBe(true);
      });

      it('uses a perk from the panel and comes back if aiming is cancelled', async () => {
        const fixture = await lose(EPerk.hammer);
        (panel(fixture).querySelector('app-rescue-perks button') as HTMLElement).click();
        fixture.detectChanges();
        expect(fixture.componentInstance.targetPerk()).toBe(EPerk.hammer);
        expect(panel(fixture)).toBeNull();

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('NO_MOVES');
      });

      it('only ends the game when asked, and then locks the tray', async () => {
        const fixture = await lose(EPerk.hammer);
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('NO_MOVES');

        buttons(fixture).at(-1)!.click();
        fixture.detectChanges();
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('GAME_OVER');
        expect(panel(fixture).querySelector('app-rescue-perks')).toBeNull();
        expect(panel(fixture).getAttribute('aria-modal')).toBe('true');
        expect(fixture.nativeElement.querySelector('app-perk-tray').hasAttribute('inert')).toBe(true);
      });

      it('asks again on the next loss after giving up', async () => {
        const fixture = await lose(EPerk.hammer);
        const app = fixture.componentInstance;
        buttons(fixture).at(-1)!.click();
        fixture.detectChanges();
        expect(app.gaveUp()).toBe(true);

        app.state$$.set(board([2, 0, ...stuck.slice(2)]));
        fixture.detectChanges();
        expect(app.gaveUp()).toBe(false);
        app.state$$.set(board(stuck));
        fixture.detectChanges();
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('NO_MOVES');
      });

      it('counts a saved game as a way back', async () => {
        const fixture = await lose();
        const app = fixture.componentInstance;
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('GAME_OVER');

        app.perks$$.update(perks => ({ ...perks, save: { state: board(stuck), score: 0, turn: 1, perks } }));
        fixture.detectChanges();
        expect(panel(fixture).querySelector('h2')!.textContent).toContain('NO_MOVES');
        expect(panel(fixture).textContent).toContain('SAVE_RESCUE');
        expect(panel(fixture).textContent).toContain('LOAD_SAVE');
      });
    });

    it('locks the tray on game over when no perk can help', async () => {
      storage.getState.mockReturnValue(board(stuck));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-perk-tray').hasAttribute('inert')).toBe(true);
    });

    it('restores perks with a saved game and starts old saves without past rewards', async () => {
      storage.getState.mockReturnValue(board([64, ...Array(15).fill(0)]));
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.perks$$().highest).toBe(64);
      expect(fixture.componentInstance.perks$$().inventory[EPerk.double]).toBe(0);
    });

    it('resets perks for a new game', () => {
      const app = TestBed.createComponent(AppComponent).componentInstance;
      app.state$$.set(board([8, 2, ...Array(14).fill(0)]));
      give(app, EPerk.hammer, 4);
      app.startNewGame();
      expect(app.perks$$().inventory[EPerk.hammer]).toBe(0);
      expect(app.perks$$().inventory[EPerk.undo]).toBe(1);
    });
  });

  it('ends the ladder at the target until the player climbs past it', async () => {
    storage.getState.mockReturnValue(board([64, ...Array(15).fill(0)]));
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const steps = () => [...fixture.nativeElement.querySelectorAll('.step')].map((step: any) => step.textContent);
    expect(steps().at(-1)).toBe('512');

    fixture.componentInstance.state$$.set(board([4096, ...Array(15).fill(0)]));
    fixture.detectChanges();
    expect(steps().slice(-3)).toEqual(['1024', '2048', '4096']);
  });

  it('never lets the score drop below zero', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.score$$.set(0);
    app.state$$.set(board([0, 2, ...Array(14).fill(0)]));
    app.move(EDirection.left);
    expect(app.score$$()).toBe(0);
  });

  it('takes swipes from the whole page, not just the board', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('main').hasAttribute('appSwipe')).toBe(true);
    expect(fixture.nativeElement.querySelector('grid-container').hasAttribute('appSwipe')).toBe(false);
  });

  it('can be destroyed before a translation subscription is created', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(() => fixture.destroy()).not.toThrow();
  });
  it('does not spawn tiles or increment turns when a move leaves the board unchanged', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.generateKeys();
    app.state$$.update(state => state.map(cell => ({ ...cell, value: cell.key === 0 ? 2 : 0 })));
    const before = structuredClone(app.state$$());
    app.move(EDirection.left);
    expect(app.state$$()).toEqual(before);
    expect(app.turn$$()).toBe(1);
    expect(app.score$$()).toBe(0);
  });

  it('uses the same move handler for arrows and gestures and removes mobile buttons', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    const move = vi.spyOn(app, 'move');
    const event = new KeyboardEvent('keydown', { code: 'ArrowRight', cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(move).toHaveBeenCalledWith(EDirection.right);
    fixture.debugElement.query(By.directive(SwipeDirective)).injector.get(SwipeDirective).swipe.emit(EDirection.left);
    expect(move).toHaveBeenCalledWith(EDirection.left);
    expect(fixture.nativeElement.querySelector('[appSwipe]')).toBeTruthy();
  });

  it('shows instructions on hover or click and dismisses them with Escape or an outside click', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const help = fixture.nativeElement.querySelector('.help') as HTMLElement;
    const button = help.querySelector('button')!;
    expect(fixture.nativeElement.querySelector('.rules')).toBeNull();
    help.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(help.querySelector('.rules')).toBeTruthy();
    help.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(help.querySelector('.rules')).toBeNull();
    button.click();
    fixture.detectChanges();
    expect(help.querySelector('.rules')).toBeTruthy();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(help.querySelector('.rules')).toBeNull();
    button.click();
    document.body.click();
    fixture.detectChanges();
    expect(help.querySelector('.rules')).toBeNull();
  });

});
