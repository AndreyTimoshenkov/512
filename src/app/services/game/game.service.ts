import { inject, Injectable } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { ShiftService } from '../shift/shift.service';
import { DEFAULT_GRID_SIZE, DEFAULT_TARGET, EDirection } from '../../interfaces/general.types';
import { ceil, cloneDeep, isEqual } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  shift = inject(ShiftService);

  isGameOver(board: IGridCellState[], size: number = DEFAULT_GRID_SIZE) {
    const state = cloneDeep(board);
    let rowsRight = this.shift.splitArray(state, EDirection.right, size);
    let rowsLeft = cloneDeep(rowsRight);
    rowsRight.forEach(line => this.shift.shiftRight(line));
    rowsLeft.forEach(line => this.shift.shiftLeft(line));
    let columnsDown = this.shift.splitArray(state, EDirection.down, size);
    let columnsUp = cloneDeep(columnsDown);
    columnsDown.forEach(line => this.shift.shiftRight(line));
    columnsUp.forEach(line => this.shift.shiftLeft(line));

    return isEqual(rowsLeft, rowsRight) && isEqual(columnsDown, columnsUp);
  }

  isGameWon(state: IGridCellState[], target: number = DEFAULT_TARGET) {
    return state.some(cell => cell.value >= target);
  }
}
