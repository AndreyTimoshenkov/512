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
import { Breakpoints } from './services/breakpoint-observer/breakpoints';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent, KeyboardComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent implements AfterViewInit{
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  turn$$: WritableSignal<number> = signal(1);
  score$$: WritableSignal<number> = signal(0);
  isMobile$$ = signal(false);
  isTablet$$ = signal(false);

  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private ls: LocalStorageService,
    private shift: ShiftService,
    private breakPointObserver: BreakpointObserver,
  ) {
    effect(() => {
      if (!this.cellList.length) { return; }

      const state = this.state$$();

      this.ls.saveState(state);

      for (const cell of state) {
        this.cellList.forEach(item => {
          if (item._cellState.key === cell.key) {
            item._cellState.value = cell.value;
            item._cellState.new = cell.new;
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
    this.isMobile$$ = toSignal(this.breakPointObserver.observe(Breakpoints.XSmall).pipe(
        map((state: BreakpointState) => state.matches)
    ));
    //@ts-ignore
    this.isTablet$$ = toSignal(this.breakPointObserver.observe(Breakpoints.Small).pipe(
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
          const [newState, score] = this.shift.shiftArray(row, direction);
          this.score$$.update(prevScore => prevScore + score);
        });

        if (!isEqual(prevState, state)) {
          this.toggleCellsOld();
          this.generateValues();
          this.turn$$.update(turn => turn += 1);
        }
        return state;
      });
    }

  generateKeys(width: number = 4, height: number = 4) {
    const state: IGridCellState[] = [];
    for (let i = 0; i < width*height; i++){
      state.push({key: i, value: 0, new: false});
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
          cell.new = true;
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

  toggleCellsOld() {
    this.state$$.update(state => {
      state.forEach(cell => cell.new = false);
      return [...state];
    })
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
    this.toggleCellsOld();

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
}
