import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, HostListener, signal, WritableSignal } from '@angular/core';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState, ITileMove, ITileSlide } from './components/grid-cell/grid-cell.type';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { ShiftService } from './services/shift/shift.service';
import { GameService } from './services/game/game.service';
import { cloneDeep, isEqual } from 'lodash';
import { SwipeDirective } from './directives/swipe.directive';
import { ColourDirective } from './directives/colour.directive';
import { LocaleSwitcherComponent } from './components/locale-switcher/locale-switcher.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TCodes } from './components/locale-switcher/locale.types';
import { GamePanelComponent } from './components/game-panel/game-panel.component';
import { TileLadderComponent } from './components/tile-ladder/tile-ladder.component';
@Component({
    selector: 'app-root',
    imports: [
    GridContainerComponent,
    GridCellComponent,
    SwipeDirective,
    ColourDirective,
    LocaleSwitcherComponent,
    GamePanelComponent,
    TileLadderComponent,
    TranslateModule
],
    templateUrl: './app.component.html',
    styleUrl: './app.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit {
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  turn$$: WritableSignal<number> = signal(1);
  score$$: WritableSignal<number> = signal(0);
  instructionsOpen = signal(false);
  confirmOpen = signal(false);
  wonOpen = signal(false);
  spawned = signal(new Set<number>());
  merged = signal(new Set<number>());
  isLost = computed(() => this.state$$().length > 0 && this.game.isGameOver(this.state$$()));
  panelOpen = computed(() => this.confirmOpen() || this.wonOpen() || this.isLost());
  best = computed(() => Math.max(0, ...this.state$$().map(cell => cell.value)));
  slides = signal<ITileSlide[]>([]);
  // Tiles travelling to a cell are drawn by their slides, so the cell stays empty until they land.
  landing = signal(new Set<number>());
  readonly slideMs = 110;
  private readonly popMs = 200;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private ls: LocalStorageService,
    private shift: ShiftService,
    private game: GameService,
    // @Inject(I18N_CORE) public readonly i18nCore$: Observable<I18nCore>,
    private translate: TranslateService
  ) {
    effect(() => {
      const state = this.state$$();
      if (!state.length) { return; }

      this.ls.saveState(state);
      this.ls.saveTurn(this.turn$$());
      this.ls.saveScore(this.score$$());
    });
    this.translate.setDefaultLang('en');
  }

  ngAfterViewInit(): void {
    this.startGame();
    const code = this.ls.getLocale()?.slice(0, 2);
    this.translate.use(code || 'ru');
  }

  @HostListener('document:click', ['$event'])
  dismissInstructions(event: MouseEvent): void {
    if (!(event.target as HTMLElement | null)?.closest?.('.help')) {
      this.instructionsOpen.set(false);
    }
  }

  @HostListener('document:focusin', ['$event'])
  onFocusChanged(event: FocusEvent): void {
    if (!(event.target as HTMLElement | null)?.closest?.('.help')) {
      this.instructionsOpen.set(false);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.instructionsOpen.set(false);
      this.closePanels();
    }
    const direction = event.code as EDirection;
    const target = event.target as HTMLElement | null;
    if (!isDirection(direction) || event.altKey || event.ctrlKey || event.metaKey ||
        target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) {
      return;
    }
    event.preventDefault();
    this.move(direction);
  }

  move(direction: EDirection) {
    if (this.panelOpen()) { return; }

    const previous = this.state$$();
    const next = cloneDeep(previous);
    const moves: ITileMove[] = [];
    let score = 0;
    for (const row of this.shift.splitArray(next, direction)) {
      const before = cloneDeep(row);
      score += this.shift.shiftArray(row, direction)[1];
      moves.push(...this.shift.traceMoves(before, row));
    }
    if (isEqual(previous, next)) { return; }

    this.state$$.set(next);
    this.score$$.update(value => value + score);
    this.spawned.set(new Set());
    this.animate(moves);
    this.generateValues();
    this.turn$$.update(turn => turn + 1);
    if (!this.game.isGameWon(previous) && this.game.isGameWon(next)) { this.wonOpen.set(true); }

  }

  private animate(moves: ITileMove[]) {
    this.timers.forEach(clearTimeout);
    const landing = new Set(moves.filter(move => move.from !== move.to).map(move => move.to));
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this.merged.set(new Set(moves.map(move => move.to).filter((to, index, all) => all.indexOf(to) !== index)));
    this.landing.set(reduceMotion ? new Set() : landing);
    this.slides.set(reduceMotion ? [] : moves.filter(move => landing.has(move.to)).map(move => this.toSlide(move)));

    this.timers = [
      setTimeout(() => {
        this.slides.set([]);
        this.landing.set(new Set());
      }, this.slideMs),
      setTimeout(() => {
        this.merged.set(new Set());
        this.spawned.set(new Set());
      }, this.slideMs + this.popMs),
    ];
  }

  private clearAnimation() {
    this.timers.forEach(clearTimeout);
    this.slides.set([]);
    this.landing.set(new Set());
    this.merged.set(new Set());
    this.spawned.set(new Set());
  }

  private toSlide({ from, to, value }: ITileMove): ITileSlide {
    const row = Math.floor(from / 4);
    const column = from % 4;
    return { value, row, column, rows: Math.floor(to / 4) - row, columns: to % 4 - column };
  }

  generateKeys(width: number = 4, height: number = 4) {
    const state: IGridCellState[] = [];
    for (let i = 0; i < width*height; i++){
      state.push({key: i, value: 0});
    }
    this.state$$.set(state);
  }

  generateValues(times: number = 1) {
    while(times > 0) {
      const state = this.state$$();
      const emptyCells = this.getEmptyCells(state);

      if (!emptyCells.length) { return; }

      const randomCell = this.shift.getRandomArrayEl(emptyCells);
      state.forEach(cell => {
        if (cell.key === randomCell.key) {
          cell.value = 2;
        }
      });
      this.spawned.update(keys => new Set(keys).add(randomCell.key));
      times--;
      this.state$$.update(() => [...state]);
   }
  }

  getEmptyCells(state: IGridCellState[]): IGridCellState[] {
    return state.filter(cell => !cell.value);
  }

  startGame() {
    const state = this.ls.getState();

    if (state.length) {
      this.state$$.set(this.ls.getState());
      this.turn$$.set(this.ls.getTurn());
      this.score$$.set(this.ls.getScore());
    } else {
      this.generateKeys();
      this.generateValues(2);
      this.turn$$.set(1);
      this.score$$.set(0);
    }
  }

  restartGame() {
    if (this.isLost()) {
      this.startNewGame();
    } else {
      this.wonOpen.set(false);
      this.confirmOpen.set(true);
    }
  }

  startNewGame() {
    this.closePanels();
    this.clearAnimation();
    this.ls.clear();
    this.startGame();
  }

  closePanels() {
    this.confirmOpen.set(false);
    this.wonOpen.set(false);
  }

  onLocaleChanged(code: TCodes) {
    const locale = code.toLocaleLowerCase();
    this.translate.use(locale);
  }
}
