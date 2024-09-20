import { Injectable } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { EDirection } from '../../interfaces/general.types';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  getRandomArrayEl<T>(array: Array<T>) {
    const randomNum = Math.floor(Math.random() * array.length);
    return array[randomNum];
  }

  splitArray(state: IGridCellState[], direction: EDirection): IGridCellState[][] {
    const result: IGridCellState[][] = [[], [], [], []];

    state.forEach((cell) => {
      const index =
        direction === EDirection.right || direction === EDirection.left
          ? Math.floor((cell.key ?? 0) / 4)
          : Math.floor((cell.key ?? 0) % 4);
      result[index].push(cell);
    });

    return result;
  }

  shiftArray(list: IGridCellState[], direction: EDirection): [IGridCellState[], number] {
   const length = list.length;
   let score = 0;
   if (direction === EDirection.right || direction === EDirection.down) {

     for (let i = 0; i < length - 1; i++) {
       if (
         (list[i].value && !list[i + 1].value) || (list[i].value === list[i + 1].value)
       ) {
         score += this.mergeCells(list[i + 1], list[i])
         list[i + 1].value += list[i].value;
         list[i].value = 0;
       }
     }
     for (let i = 0; i < length - 1; i++) {
       if (list[i].value && !list[i + 1].value) {
         list[i + 1].value = list[i].value;
         list[i].value = 0;
       }
     }
     for (let i = 0; i < length - 1; i++) {
       if (list[i].value && !list[i + 1].value) {
         list[i + 1].value = list[i].value;
         list[i].value = 0;
       }
     }
   } else if (direction === EDirection.up || direction === EDirection.left) {
      for (let i = length - 1; i > 0; i--) {
       if ((list[i].value && !list[i - 1].value) || list[i].value === list[i - 1].value) {
         score += this.mergeCells(list[i - 1], list[i])
         list[i - 1].value += list[i].value;
         list[i].value = 0;
       }
     }
     for (let i = list.length - 1; i > 0; i--) {
       if (list[i].value && !list[i - 1].value) {
         list[i - 1].value = list[i].value;
         list[i].value = 0;
       }
     }
     for (let i = list.length - 1; i > 0; i--) {
       if (list[i].value && !list[i - 1].value) {
         list[i - 1].value = list[i].value;
         list[i].value = 0;
       }
     }
   }
   return [list, score];
  }

  mergeCells(cell1: IGridCellState, cell2: IGridCellState): number {
    if (cell1.value === 0 || cell2.value === 0) { return 0; }

    if (cell1.value !== cell2.value) { return 0; }

    return cell1.value + cell2.value;
  }
}
