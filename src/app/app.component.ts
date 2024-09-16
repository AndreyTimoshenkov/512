import { AfterViewInit, ChangeDetectionStrategy, Component, effect, HostListener, signal, ViewChildren, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';
import { getRandomArrayEl, shiftArray, splitArray } from './helpers/array.helpers';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit{
  title = '512';
  state: WritableSignal<Array<IGridCellState>> = signal([]);
  turn: number = 0;
  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor() {
    effect(() => {
      if (!this.cellList.length) { return; }

      const state = this.state();

      for (const cell of state) {
        this.cellList.forEach(item => {
          if (item._cellState.key === cell.key) {
            item._cellState.value = cell.value
          }
        })
      }
      const emptyCells = this.getEmptyCells(state);

      if (!emptyCells.length) { console.log('GAME OVER!!'); return; }
    });
  }
  ngAfterViewInit(): void {
    this.generateKeys();
    this.generateValues();
  }

  @HostListener('window:keydown', ['$event'])
    move(event: KeyboardEvent) {
      if (!isDirection(event.code)) { return; }
      this.state.update((state) => {
        const split = splitArray(state, event.code as EDirection);
        split.forEach(list => {
          shiftArray(list, event.code as EDirection);
        });
        return [...split].flat()
      });

      this.generateValues();
    }

  onGridCellEmit(state: IGridCellState) {
    // console.log(state);
  }

  generateKeys(width: number = 4, height: number = 4) {
    for (let i = 0; i < width*height; i++){
      this.state.update((state) => [...state, {key: i, value: 0}]);
    }
  }

  generateValues() {
    const state = this.state();
    const emptyCells = this.getEmptyCells(state);

    if (!emptyCells.length) { return; }

    const randomCell = getRandomArrayEl(emptyCells);
    state.forEach(cell => {
      if (cell.key === randomCell.key) {
        cell.value = 2;
      }
    });
    this.turn++;
    if (this.turn === 1) { this.generateValues(); }
    this.state.update(() => [...state]);
  }

  getEmptyCells(state: IGridCellState[]): IGridCellState[] {
    return state.filter(cell => !cell.value);
  }
}
