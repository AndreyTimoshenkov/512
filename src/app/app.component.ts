import { AfterViewInit, ChangeDetectorRef, Component, effect, HostListener, signal, ViewChildren, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { ShiftService } from './services/shift/shift.service';
import { KeyboardComponent } from './components/keyboard/keyboard/keyboard.component';
import { BreakpointObserver, BreakpointState } from './services/breakpoint-observer/breakpoint-observer';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';
import { ColourDirective } from './directives/colour.directive';
import { GameService } from './services/game/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent, KeyboardComponent, NgIf, ColourDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent implements AfterViewInit{
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  turn$$: WritableSignal<number> = signal(1);
  score$$: WritableSignal<number> = signal(0);
  isMobile$$ = signal(false);
  hasBeenContinued$$: WritableSignal<boolean> = signal(false);

  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private ls: LocalStorageService,
    private shift: ShiftService,
    private breakPointObserver: BreakpointObserver,
    private game: GameService,
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

        if (this.game.isGameOver(state)) {
          const confirmed = confirm('Game OVER! Would you like to play again?')
          confirmed ? this.restartGame() : null;
        }
        if (this.game.isGameWon(state) && !this.hasBeenContinued$$()) {
          const confirmed = confirm('YOU WON! You have reached the goal! \nWould you like to continue playing or would you like to start a new game?')
          confirmed ? this.restartGame() : this.hasBeenContinued$$.set(true);;

        }

      }, 0);
    });
    //@ts-ignore
    this.isMobile$$ = toSignal(this.breakPointObserver.observe('(max-width: 959.98px)').pipe(
        map((state: BreakpointState) => state.matches)
    ));
  }

  ngAfterViewInit(): void {
    this.startGame();
  }

  @HostListener('window:keydown', ['$event'])
    move(event: KeyboardEvent) {
      const direction = event.code as EDirection;

      if (!isDirection(direction)) { return; }

      this.state$$.update(state => {
        const prevState = cloneDeep(state)
        const split = this.shift.splitArray(state, direction);
        split.forEach(row => {
          const newState = this.shift.shiftArray(row, direction);
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
        const state= this.shift.shiftArray(row, direction);
      });
      return state;
    });

    this.turn$$.update(turn => turn += 1);

    this.generateValues();
  }
}
