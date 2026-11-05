import { vi, type Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { SwipeDirective } from './directives/swipe.directive';
import { EDirection } from './interfaces/general.types';
import { AppComponent } from './app.component';
import { LocalStorageService } from './services/local-storage/local-storage.service';

describe('AppComponent', () => {
  let storage: Mocked<Pick<LocalStorageService, keyof LocalStorageService>>;

  beforeEach(async () => {
    storage = {
      getState: vi.fn<LocalStorageService['getState']>().mockReturnValue([]),
      getTurn: vi.fn<LocalStorageService['getTurn']>().mockReturnValue(1),
      getScore: vi.fn<LocalStorageService['getScore']>().mockReturnValue(0),
      getLocale: vi.fn<LocalStorageService['getLocale']>().mockReturnValue(null),
      saveState: vi.fn(),
      saveTurn: vi.fn(),
      saveScore: vi.fn(),
      saveLocale: vi.fn(),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [{ provide: LocalStorageService, useValue: storage }],
    }).compileComponents();
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

  it('skips the slide when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.state$$.set(board([2, 2, ...Array(14).fill(0)]));
    app.move(EDirection.right);
    vi.unstubAllGlobals();
    expect(app.slides()).toEqual([]);
    expect(app.landing().size).toBe(0);
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
    expect(fixture.nativeElement.querySelector('app-keyboard')).toBeNull();
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
