import { computed, Injectable, signal } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { EDirection } from '../../interfaces/general.types';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  score$$ = signal(0);

  getEmptyCells(state: IGridCellState[]): IGridCellState[] {
    return state.filter(cell => !cell.value);
  }

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

  shiftArray(list: IGridCellState[], direction: EDirection): IGridCellState[] {
   if (direction === EDirection.right || direction === EDirection.down) {
    return this.shiftRight(list);
   } else if (direction === EDirection.up || direction === EDirection.left) {
    return this.shiftLeft(list);
   }
   return list;
  }

  shiftRight(nums: IGridCellState[]): IGridCellState[] {
    let count = nums.length;
    while (count) {
      for (let index = nums.length - 1; index > 0; index--) {
        if (nums[index].value === nums[index - 1].value || !nums[index].value) {
          nums[index].value += nums[index - 1].value;
          nums[index - 1].value = 0;
        }
      }
      count--;
    }
    return nums;
  }

  shiftLeft(nums: IGridCellState[]): IGridCellState[] {
    let count = 0;
    while (count < nums.length) {
      for (let index = 0; index < nums.length - 1; index++) {
        if (nums[index].value === nums[index + 1].value || !nums[index].value) {
          nums[index].value += nums[index + 1].value;
          nums[index + 1].value = 0;
        }
      }
      count += 1;
    }
    return nums;
  }
}