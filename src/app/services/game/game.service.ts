import { inject, Injectable } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { ShiftService } from '../shift/shift.service';
import { EDirection } from '../../interfaces/general.types';
import { cloneDeep, isEqual } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  shift = inject(ShiftService);

  isGameOver(state: IGridCellState[]) {
    let rowsRight = this.shift.splitArray(state, EDirection.right);
    let rowsLeft = cloneDeep(rowsRight);
    rowsRight.forEach(line => this.shift.shiftRight(line));
    rowsLeft.forEach(line => this.shift.shiftLeft(line));
    let columnsDown = this.shift.splitArray(state, EDirection.down);
    let columnsUp = cloneDeep(columnsDown);
    columnsDown.forEach(line => this.shift.shiftRight(line));
    columnsUp.forEach(line => this.shift.shiftLeft(line));

    return isEqual(rowsLeft, rowsRight) && isEqual(columnsDown, columnsUp);
  }

  isGameWon(state: IGridCellState[]) {
    return state.some(cell => cell.value === 512);
  }
}
