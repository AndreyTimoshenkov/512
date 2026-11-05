import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, linkedSignal, signal, WritableSignal } from '@angular/core';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState, ITileMove, ITileSlide } from './components/grid-cell/grid-cell.type';
import { DEFAULT_GRID_SIZE, DEFAULT_TARGET, EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { ShiftService } from './services/shift/shift.service';
import { GameService } from './services/game/game.service';
import { cloneDeep, isEqual, omit } from 'lodash';
import { SwipeDirective } from './directives/swipe.directive';
import { ColourDirective } from './directives/colour.directive';
import { LocaleSwitcherComponent } from './components/locale-switcher/locale-switcher.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TCodes } from './components/locale-switcher/locale.types';
import { GamePanelComponent } from './components/game-panel/game-panel.component';
import { GameSetupComponent } from './components/game-setup/game-setup.component';
import { TileLadderComponent } from './components/tile-ladder/tile-ladder.component';
import { PerkTrayComponent } from './components/perk-tray/perk-tray.component';
import { PerksService } from './services/perks/perks.service';
import { DOUBLE_MOVES, EPerk, IPerkHint, IPerkState, PERKS, TILE_PERKS } from './interfaces/perk.types';
@Component({
    selector: 'app-root',
    imports: [
    GridContainerComponent,
    GridCellComponent,
    SwipeDirective,
    ColourDirective,
    LocaleSwitcherComponent,
    GamePanelComponent,
    GameSetupComponent,
    TileLadderComponent,
    PerkTrayComponent,
    TranslateModule
],
    templateUrl: './app.component.html',
    styleUrl: './app.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit {
  private perks = inject(PerksService);
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  turn$$: WritableSignal<number> = signal(1);
  score$$: WritableSignal<number> = signal(0);
  target$$: WritableSignal<number> = signal(DEFAULT_TARGET);
  // The grid is square, so the saved board already says how big it is.
  size = computed(() => Math.round(Math.sqrt(this.state$$().length)) || DEFAULT_GRID_SIZE);
  // What the next game will use; follows the running game until the player picks something else.
  setupTarget = linkedSignal(() => this.target$$());
  setupSize = linkedSignal(() => this.size());
  instructionsOpen = signal(false);
  confirmOpen = signal(false);
  wonOpen = signal(false);
  spawned = signal(new Set<number>());
  merged = signal(new Set<number>());
  isLost = computed(() => this.state$$().length > 0 && this.game.isGameOver(this.state$$(), this.size()));
  panelOpen = computed(() => this.confirmOpen() || this.wonOpen() || this.isLost());
  best = computed(() => Math.max(0, ...this.state$$().map(cell => cell.value)));
  // The ladder ends at the target until the player climbs past it.
  ladderEnd = computed(() => Math.max(this.target$$(), this.best()));
  rewardTiles = computed(() => this.perks.rewardTiles(this.target$$()));
  perks$$: WritableSignal<IPerkState> = signal(this.perks.newPerks());
  // A tile perk waiting for the player to pick its tile, and the first pick of a swap.
  targetPerk = signal<EPerk | null>(null);
  swapFirst = signal<number | null>(null);
  notice = signal<IPerkHint | null>(null);
  availablePerks = computed(() => new Set(PERKS.filter(perk =>
    this.perks.isAvailable(perk, this.perks$$(), this.state$$(), this.size(), this.isLost()))));
  pickable = computed(() => {
    const perk = this.targetPerk();
    return perk ? this.perks.pickable(perk, this.state$$(), this.size(), this.swapFirst()) : new Set<number>();
  });
  canRescue = computed(() => this.isLost() && this.availablePerks().size > 0);
  perksLocked = computed(() => this.confirmOpen() || this.wonOpen() || (this.isLost() && !this.canRescue()));
  hint = computed<IPerkHint | null>(() => {
    const moves = this.perks$$().doubleMoves;
    return this.notice() ?? (moves ? { key: 'PERK_DOUBLE_ACTIVE', moves } : null);
  });
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
      this.ls.saveTarget(this.target$$());
      this.ls.savePerks(this.perks$$());
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
      this.cancelTarget();
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
    for (const row of this.shift.splitArray(next, direction, this.size())) {
      const before = cloneDeep(row);
      score += this.shift.shiftArray(row, direction)[1];
      moves.push(...this.shift.traceMoves(before, row));
    }
    if (isEqual(previous, next)) { return; }

    const perksBefore = omit(this.perks$$(), 'undo');
    const snapshot = { state: previous, score: this.score$$(), turn: this.turn$$(), perks: perksBefore };

    this.cancelTarget();
    this.notice.set(null);
    this.state$$.set(next);
    // Every move costs a point, so only merges worth more than that raise the score. It never drops below zero.
    const earned = score * (perksBefore.doubleMoves ? 2 : 1);
    this.score$$.update(value => Math.max(0, value + earned - 1));
    this.spawned.set(new Set());
    this.animate(moves);
    this.generateValues();
    this.turn$$.update(turn => turn + 1);
    this.collectRewards(perksBefore, { ...snapshot, spawn: [...this.spawned()][0] ?? null });
    const target = this.target$$();
    if (!this.game.isGameWon(previous, target) && this.game.isGameWon(next, target)) { this.wonOpen.set(true); }
  }

  private collectRewards(before: Omit<IPerkState, 'undo'>, undo: IPerkState['undo']) {
    const best = this.best();
    const rewards = this.perks.earned(before.highest, best, this.target$$());
    const inventory = { ...before.inventory };
    rewards.forEach(perk => inventory[perk]++);

    this.perks$$.set({
      inventory,
      highest: Math.max(before.highest, best),
      doubleMoves: Math.max(0, before.doubleMoves - 1),
      nextSpawn: null,
      undo,
      save: before.save,
    });
    if (rewards.length) {
      this.notice.set({ key: 'PERK_EARNED', tile: best });
    }
  }

  usePerk(perk: EPerk) {
    if (this.targetPerk() === perk) {
      this.cancelTarget();
      return;
    }
    this.cancelTarget();
    if (!this.availablePerks().has(perk)) {
      this.explainPerk(perk);
      return;
    }

    if (perk === EPerk.undo) {
      this.undo();
    } else if (perk === EPerk.double) {
      this.perks$$.update(perks => ({ ...this.spent(perks, perk), doubleMoves: DOUBLE_MOVES }));
      this.notice.set(null);
    } else if (perk === EPerk.save) {
      this.saveGame();
    } else if (perk === EPerk.sweep) {
      this.applyPerk(perk, this.perks.sweep(this.state$$()));
    } else if (perk === EPerk.shuffle) {
      this.applyPerk(perk, this.perks.shuffle(this.state$$(), this.size()));
    } else if (TILE_PERKS.includes(perk)) {
      this.targetPerk.set(perk);
      this.notice.set({ key: `PERK_${perk}_PICK` });
    }
  }

  // Tapping a perk that can't be used explains it instead, which is how phone players learn what each one does.
  private explainPerk(perk: EPerk) {
    const tile = this.perks.rewardTile(perk, this.target$$());
    const name = `PERK_${perk}_INFO`;
    const locked = !this.perks$$().inventory[perk] && tile > this.perks$$().highest;
    this.notice.set(locked ? { key: 'PERK_LOCKED', name, tile } : { key: name });
  }

  private spent(perks: IPerkState, perk: EPerk): IPerkState {
    return { ...perks, inventory: { ...perks.inventory, [perk]: perks.inventory[perk] - 1 } };
  }

  private applyPerk(perk: EPerk, next: IGridCellState[], changed: number[] = []) {
    this.animate([]);
    this.merged.set(new Set(changed));
    this.state$$.set(next);
    this.perks$$.update(perks => this.spent(perks, perk));
    this.notice.set(null);
  }

  private saveGame() {
    const perks = this.spent(this.perks$$(), EPerk.save);
    const save = { state: cloneDeep(this.state$$()), score: this.score$$(), turn: this.turn$$(), perks: omit(perks, 'undo', 'save') };
    this.perks$$.set({ ...perks, save });
    this.notice.set({ key: 'PERK_SAVE_DONE' });
  }

  loadSave() {
    const save = this.perks$$().save;
    if (!save) { return; }

    this.clearAnimation();
    this.state$$.set(save.state);
    this.score$$.set(save.score);
    this.turn$$.set(save.turn);
    this.perks$$.set({ ...save.perks, undo: null, save: null });
    this.notice.set({ key: 'PERK_SAVE_LOADED' });
  }

  private undo() {
    const snapshot = this.perks$$().undo;
    if (!snapshot) { return; }

    this.clearAnimation();
    this.wonOpen.set(false);
    this.notice.set(null);
    this.state$$.set(snapshot.state);
    this.score$$.set(snapshot.score);
    this.turn$$.set(snapshot.turn);
    // Going back also reverses what the move earned or spent. An undo earned by that very move pays for itself.
    const inventory = snapshot.perks.inventory;
    this.perks$$.set({
      ...snapshot.perks,
      inventory: { ...inventory, [EPerk.undo]: Math.max(0, inventory[EPerk.undo] - 1) },
      nextSpawn: snapshot.spawn,
      undo: null,
    });
  }

  onTap({ x, y }: { x: number; y: number }) {
    if (!this.targetPerk()) { return; }
    const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('grid-cell[data-key]');
    if (cell) { this.pickTile(Number(cell.dataset['key'])); }
  }

  pickTile(key: number) {
    const perk = this.targetPerk();
    if (!perk || !this.pickable().has(key)) { return; }

    const state = this.state$$();
    if (perk === EPerk.hammer) {
      this.cancelTarget();
      this.applyPerk(perk, this.perks.hammer(state, key));
    } else if (perk === EPerk.upgrade) {
      this.cancelTarget();
      this.applyPerk(perk, this.perks.upgrade(state, key), [key]);
    } else if (this.swapFirst() === null) {
      this.swapFirst.set(key);
      this.notice.set({ key: 'PERK_SWAP_PICK_SECOND' });
    } else {
      const first = this.swapFirst()!;
      this.cancelTarget();
      this.applyPerk(perk, this.perks.swap(state, first, key), [first, key]);
    }
  }

  cancelTarget() {
    if (!this.targetPerk()) { return; }
    this.targetPerk.set(null);
    this.swapFirst.set(null);
    this.notice.set(null);
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
    const size = this.size();
    const row = Math.floor(from / size);
    const column = from % size;
    return { value, row, column, rows: Math.floor(to / size) - row, columns: to % size - column };
  }

  generateKeys(width: number = DEFAULT_GRID_SIZE, height: number = width) {
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

      const randomCell = emptyCells.find(cell => cell.key === this.perks$$().nextSpawn)
        ?? this.shift.getRandomArrayEl(emptyCells);
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

  startGame(size: number = DEFAULT_GRID_SIZE) {
    const state = this.ls.getState();

    if (state.length) {
      this.state$$.set(this.ls.getState());
      this.turn$$.set(this.ls.getTurn());
      this.score$$.set(this.ls.getScore());
      this.target$$.set(this.ls.getTarget());
      this.perks$$.set(this.perks.restore(this.ls.getPerks(), this.best()));
    } else {
      this.perks$$.set(this.perks.newPerks());
      this.generateKeys(size);
      this.generateValues(2);
      this.turn$$.set(1);
      this.score$$.set(0);
    }
  }

  restartGame() {
    this.cancelTarget();
    this.wonOpen.set(false);
    this.confirmOpen.set(true);
  }

  startNewGame() {
    const target = this.setupTarget();
    const size = this.setupSize();
    this.closePanels();
    this.cancelTarget();
    this.notice.set(null);
    this.clearAnimation();
    this.ls.clear();
    this.target$$.set(target);
    this.startGame(size);
  }

  closePanels() {
    this.confirmOpen.set(false);
    this.wonOpen.set(false);
    this.setupTarget.set(this.target$$());
    this.setupSize.set(this.size());
  }

  onLocaleChanged(code: TCodes) {
    const locale = code.toLocaleLowerCase();
    this.translate.use(locale);
  }
}
