import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, HostListener, OnInit, signal, ViewChildren, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';
import { getRandomArrayEl, shiftArray, splitArray } from './helpers/array.helpers';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit, OnInit{
  state: WritableSignal<Array<IGridCellState>> = signal([]);
  turn: number = 0;
  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor(
    // private cdr: ChangeDetectorRef,
    private ls: LocalStorageService,
  ) {
    effect(() => {
      if (!this.cellList.length) { return; }

      const state = this.state();

      this.ls.saveState(state);

      for (const cell of state) {
        this.cellList.forEach(item => {
          if (item._cellState.key === cell.key) {
            item._cellState.value = cell.value;
            item._cellState.new = cell.new;
          }
        })
      }
      const emptyCells = this.getEmptyCells(state);

      if (!emptyCells.length) { alert('GAME OVER!!'); return; }
      this.turn++;

    });
  }
  ngOnInit(): void {
    console.log('oninit')
    // this.state.set(this.ls.getState());
  }

  ngAfterViewInit(): void {
    // this.state.update(() => this.ls.getState() || []);
    // console.log(this.ls.getState());

    this.generateKeys();
    this.generateValues(2);
  }

  @HostListener('window:keydown', ['$event'])
    move(event: KeyboardEvent) {

      const direction = event.code as EDirection;

      if (!isDirection(direction)) { return; }

      this.toggleCellsOld();

      this.state.update(state => {
        const split = splitArray(state, direction);
        split.forEach(row => shiftArray(row, direction));
        return state;
      })

      this.generateValues();

    }

  // onGridCellEmit(state: IGridCellState) {
  //   // console.log(state);
  // }

  generateKeys(width: number = 4, height: number = 4) {
    for (let i = 0; i < width*height; i++){
      this.state.update((state) => [...state, {key: i, value: 0, new: false}]);
    }
  }

  generateValues(times: number = 1) {
    while(times > 0) {
      const state = this.state();
      const emptyCells = this.getEmptyCells(state);

      if (!emptyCells.length) { return; }

      const randomCell = getRandomArrayEl(emptyCells);
      state.forEach(cell => {
        if (cell.key === randomCell.key) {
          cell.value = 2;
          cell.new = true;
        }
      });
      times--;
      this.state.update(() => [...state]);
   }
  }

  getEmptyCells(state: IGridCellState[]): IGridCellState[] {
    return state.filter(cell => !cell.value);
  }

  toggleCellsOld() {
    this.state.update(state => {
      state.forEach(cell => cell.new = false);
      return [...state];
    })
  }

  startGame() {
    this.state.set([]);
    this.generateKeys();
    this.generateValues(2);
    this.turn = 0;
  }

  restartGame() {
    this.ls.clear();
    this.startGame();
  }
}
