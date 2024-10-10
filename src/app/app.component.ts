import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, HostListener, signal, ViewChildren, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { ShiftService } from './services/shift/shift.service';
import { BreakpointObserver, BreakpointState } from './services/breakpoint-observer/breakpoint-observer';
import { AsyncPipe, NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';
import { ColourDirective } from './directives/colour.directive';
import { LocaleSwitcherComponent } from './components/locale-switcher/locale-switcher.component';
import { KeyboardComponent } from './components/keyboard/keyboard.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TCodes } from './components/locale-switcher/locale.types';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, GridContainerComponent, GridCellComponent, KeyboardComponent, NgIf,
    ColourDirective, LocaleSwitcherComponent, AsyncPipe, TranslateModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  turn$$: WritableSignal<number> = signal(1);
  score$$: WritableSignal<number> = signal(0);
  isMobile$$ = signal(false);
  translations = {
    'RU': { game: 'Новая игра', turn: 'Ход', score: 'Счёт', rules: 'Как играть: Используйте клавиши со стрелками, чтобы перемещать плитки. Плитки с одинаковыми числами объединяются в одну, когда они соприкасаются. Складывайте их, чтобы получить 512!' },
    'EN' : { game: 'New game', turn: 'Turn', score: 'Score', rules: 'How to play: Use your arrow keys to move the tiles. Tiles with the same number merge into one when they touch. Add them up to reach 512!' },
    'TR' : { game: 'Yeni oyun', turn: 'Dönüş', score: 'Gol', rules: "Nasıl oynanır: Taşları hareket ettirmek için ok tuşlarını kullanın. Aynı sayıya sahip taşlar birbirine değdiğinde birleşir. 512t'ye ulaşmak için bunları toplayın"},
    'FR' : { game: 'Nouveau jeu', turn: 'Tourner', score: 'Score', rules: "Comment jouer : utilisez les touches fléchées pour déplacer les tuiles. Les tuiles portant le même numéro fusionnent en une seule lorsqu'elles se touchent. Additionnez-les pour atteindre 512 !"}
  }
  //@ts-ignore
  params;

  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private ls: LocalStorageService,
    private shift: ShiftService,
    private breakPointObserver: BreakpointObserver,
    // @Inject(I18N_CORE) public readonly i18nCore$: Observable<I18nCore>,
    private translate: TranslateService
  ) {
    effect(() => {
      if (!this.cellList.length) { return; }

      const state = this.state$$();

      this.ls.saveState(state);

      for (const cell of state) {
        this.cellList.forEach(item => {
          if (item._cellState.key === cell.key) {
            item._cellState.value = cell.value;
          }
        })
      }

      this.ls.saveTurn(this.turn$$());
      this.ls.saveScore(this.score$$());

      setTimeout(() => {
        this.cdr.detectChanges();

        return !this.hasEmptyCells(this.cellList).length
          ? alert('GAME OVER!!')
          : null;
      }, 0);
    });
    //@ts-ignore
    this.isMobile$$ = toSignal(this.breakPointObserver.observe('(max-width: 959.98px)').pipe(
        map((state: BreakpointState) => state.matches)
    ));

    this.translate.setDefaultLang('en');
  }

  ngAfterViewInit(): void {
    this.startGame();
    const code = this.ls.getLocale()?.slice(0, 2);
    this.translate.use(code || 'ru');
  }

  @HostListener('window:keydown', ['$event'])
    move(event: KeyboardEvent) {
      const direction = event.code as EDirection;

      if (!isDirection(direction)) { return; }

      this.state$$.update(state => {
        const prevState = cloneDeep(state)
        const split = this.shift.splitArray(state, direction);
        split.forEach(row => {
          const [newState, score] = this.shift.shiftArray(row, direction);
          this.score$$.update(prevScore => prevScore + score);
        });

        if (!isEqual(prevState, state)) {
          this.generateValues();
          this.turn$$.update(turn => turn += 1);
        }
        return state;
      });
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
      times--;
      this.state$$.update(() => [...state]);
   }
  }

  getEmptyCells(state: IGridCellState[]): IGridCellState[] {
    return state.filter(cell => !cell.value);
  }

  hasEmptyCells(list: GridCellComponent[]): GridCellComponent[] {
    return list.filter(cell => !cell._cellState.value)
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
    const confirmed = confirm('Are you sure you want to start a new game? All progress will be lost')
    if (confirmed) {
      this.ls.clear();
      this.startGame();
    }
  }

  onKeyboardClick(direction: EDirection) {
    this.state$$.update(state => {
      const split = this.shift.splitArray(state, direction);
      split.forEach(row => {
        const [state, score] = this.shift.shiftArray(row, direction);
        this.score$$.update(prevScore => prevScore + score);
      });
      return state;
    });

    this.turn$$.update(turn => turn += 1);

    this.generateValues();
  }

  onLocaleChanged(code: TCodes) {
    const locale = code.toLocaleLowerCase();
    this.translate.use(locale);
    this.params = this.selectParams(code);
    console.log(code, this.params);
  }

  selectParams(code: TCodes){
    // console.log(this.param[`${code}`]);
    return (this.translations[`${code}`]);
  }
}