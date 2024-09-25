import { ChangeDetectorRef, Component, ContentChildren, effect, OnInit, signal, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';
import { IGridCellState } from '../grid-cell/grid-cell.type';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { ShiftService } from '../../services/shift/shift.service';
import { EDirection } from '../../interfaces/general.types';
import { isDirection } from '../../helpers/event.helpers';
import { cloneDeep, isEqual } from 'lodash';
import { ColourDirective } from '../../directives/colour.directive';

@Component({
  selector: 'grid-container',
  standalone: true,
  imports: [GridCellComponent, ColourDirective],
  templateUrl: './grid-container.component.html',
  styleUrl: './grid-container.component.less'
})
export class GridContainerComponent implements OnInit {
  state$$: WritableSignal<Array<IGridCellState>> = signal([]);
  @ViewChildren(GridCellComponent) cellList: Array<GridCellComponent> = [];

  constructor(
    private ls: LocalStorageService,
    private cdr: ChangeDetectorRef,
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
          }
        })
      }

      setTimeout(() => {
        this.cdr.detectChanges();

        return !this.hasEmptyCells(this.cellList).length
          ? alert('GAME OVER!!')
          : null;
      }, 0);
    });
  }
  ngOnInit(): void {
    this.startGame();
  }

  move(direction: EDirection) {

    this.state$$.update(state => {
      const prevState = cloneDeep(state)
      const split = this.shift.splitArray(state, direction);
      split.forEach(row => {
        const [newState, score] = this.shift.shiftArray(row, direction);
      });

      if (!isEqual(prevState, state)) {
        this.generateValues();
      }
      return state;
    });
  }

  hasEmptyCells(list: GridCellComponent[]): GridCellComponent[] {
    return list.filter(cell => !cell._cellState.value)
  }

  getEmptyCells(state: IGridCellState[]): IGridCellState[] {
    return state.filter(cell => !cell.value);
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

  startGame() {
    const state = this.ls.getState();

    if (state.length) {
      this.state$$.set(this.ls.getState());
    } else {
      this.generateKeys();
      this.generateValues(2);
    }
  }

  restartGame() {
    const confirmed = confirm('Are you sure you want to start a new game? All progress will be lost')
    if (confirmed) {
      this.ls.clear();
      this.startGame();
    }
  }
}
