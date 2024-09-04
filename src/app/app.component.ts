import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, Component, ContentChildren, effect, HostListener, Injector, OnInit, signal, ViewChildren, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { GridRowComponent } from './components/grid-row/grid-row.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent, GridRowComponent],
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

      for (const cell of this.state()) {
        this.cellList.forEach(item => {
          if (item._cellState.key === cell.key) {
            item._cellState.value = cell.value
          }
        })
      }
    });
  }
  ngAfterViewInit(): void {
    this.generateKeys();
    this.generateValues();
    // this.generateValues();
  }

  @HostListener('window:keydown.ArrowRight', ['$event'])
  right(event: KeyboardEvent) {
    // this.state.update((state) => {
    //   return [...this.shiftArrayRight(state)]
    // });
    this.generateValues();
    this.turn += 1;
  }

  @HostListener('window:keydown.ArrowLeft', ['$event'])
  left(event: KeyboardEvent) {
    // this.state.update((state) => {
    //   return Array.from(this.shiftArrayLeft(state))
    // });
    this.generateValues();
    this.turn += 1;
  }

  shiftArrayRight(list: Array<number>): Array<number> {
    for (let i = 0; i < list.length - 1; i++) {
      if ((list[i] && !list[i + 1]) || list[i] === list[i + 1]) {
        list[i + 1] += list[i];
        list[i] = 0;
      }
    }
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i] && !list[i + 1]) {
        list[i + 1] += list[i];
        list[i] = 0;
      }
    }
    return list;
  }

  shiftArrayLeft(list: Array<number>): Array<number> {
    for (let i = list.length - 1; i > 0; i--) {
      if ((list[i] && !list[i - 1]) || list[i] === list[i - 1]) {
        list[i - 1] += list[i];
        list[i] = 0;
      }
    }
    for (let i = list.length - 1; i > 0; i--) {
      if (list[i] && !list[i - 1]) {
        list[i - 1] = list[i];
        list[i] = 0;
      }
    }
    return list;
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
    let emptyCells = state.filter(cell => !cell.value);

    if (!emptyCells.length) { console.log('GAME OVER!!'); return; }

    let randomCell = this.getRandomArrayEl(emptyCells);
    state.forEach(cell => {
      if (cell.key === randomCell.key) {
        cell.value = 2;
      }
    });
    if (!this.turn) {
      emptyCells = state.filter(cell => !cell.value);
      randomCell = this.getRandomArrayEl(emptyCells);
      state.forEach(cell => {
        if (cell.key === randomCell.key) {
          cell.value = 2;
        }
      });
    }


    this.state.update(() => [...state]);
  }

  getRandomArrayEl<T>(array: Array<T>) {
    const randomNum = Math.floor(Math.random() * array.length);
    return array[randomNum];
  }
}
