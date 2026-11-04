import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { LocalStorageService } from './services/local-storage/local-storage.service';

describe('AppComponent', () => {
  let storage: jasmine.SpyObj<LocalStorageService>;

  beforeEach(async () => {
    storage = jasmine.createSpyObj('LocalStorageService', [
      'getState', 'getTurn', 'getScore', 'getLocale',
      'saveState', 'saveTurn', 'saveScore', 'saveLocale', 'clear',
    ]);
    storage.getState.and.returnValue([]);
    storage.getTurn.and.returnValue(1);
    storage.getScore.and.returnValue(0);
    storage.getLocale.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [{ provide: LocalStorageService, useValue: storage }],
    }).compileComponents();
  });

  it('starts a new game with sixteen cells and two initial tiles', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    tick();

    const app = fixture.componentInstance;
    expect(app.state$$().length).toBe(16);
    expect(app.state$$().filter(cell => cell.value === 2).length).toBe(2);
    expect(app.turn$$()).toBe(1);
    expect(app.score$$()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('grid-cell').length).toBe(16);
    expect(fixture.nativeElement.querySelectorAll('grid-cell.has-value').length).toBe(2);
  }));

  it('restores the saved board, turn and score in the scoreboard', fakeAsync(() => {
    const state = Array.from({ length: 16 }, (_, key) => ({ key, value: key === 0 ? 8 : 0 }));
    storage.getState.and.returnValue(state);
    storage.getTurn.and.returnValue(7);
    storage.getScore.and.returnValue(24);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    tick();

    const app = fixture.componentInstance;
    expect(app.state$$()).toEqual(state);
    expect(app.turn$$()).toBe(7);
    expect(app.score$$()).toBe(24);
    const scoreboard = fixture.nativeElement.querySelector('.scoreboard_text') as HTMLElement;
    expect(scoreboard.textContent).toContain('TURN: 7');
    expect(scoreboard.textContent).toContain('SCORE: 24');
    expect(fixture.nativeElement.querySelector('grid-cell .value').textContent).toContain('8');
  }));

  it('can be destroyed before a translation subscription is created', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(() => fixture.destroy()).not.toThrow();
  });
});
