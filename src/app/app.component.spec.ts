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
    expect(scoreboard.textContent).toContain('TURN: 7');
    expect(scoreboard.textContent).toContain('SCORE: 24');
    expect(fixture.nativeElement.querySelector('grid-cell .value').textContent).toContain('8');
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
