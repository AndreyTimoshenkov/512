import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, HostListener, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { ShiftService } from './services/shift/shift.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit{
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  turn$$: WritableSignal<number> = signal(1);
  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private ls: LocalStorageService,
    private shift: ShiftService,
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

      setTimeout(() => {
        this.cdr.detectChanges();

        return !this.hasEmptyCells(this.cellList).length
          ? alert('GAME OVER!!')
          : null;
      }, 0);

    });
  }

  ngAfterViewInit(): void {
    this.startGame();
  }

  @HostListener('window:keydown', ['$event'])
    move(event: KeyboardEvent) {

      const direction = event.code as EDirection;

      if (!isDirection(direction)) { return; }

      this.toggleCellsOld();

      this.state$$.update(state => {
        const split = this.shift.splitArray(state, direction);
        split.forEach(row => this.shift.shiftArray(row, direction));
        return state;
      });

      this.turn$$.update(turn => turn += 1);

      this.generateValues();
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
    this.state$$.set(this.ls.getState());
    this.turn$$.set(this.ls.getTurn());

    if (!state.length) {
      this.generateKeys();
      this.generateValues(2);
      this.turn$$.set(1);
    }
  }

  restartGame() {
    this.ls.clear();
    this.startGame();
  }
}
