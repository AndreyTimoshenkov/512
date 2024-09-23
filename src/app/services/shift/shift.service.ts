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

  //@ts-ignore
  shiftArray(list: IGridCellState[], direction: EDirection): [IGridCellState[], number] {
   if (direction === EDirection.right || direction === EDirection.down) {
    return this.shiftRight(...this.shiftRight(...this.shiftRight(list)))
   } else if (direction === EDirection.up || direction === EDirection.left) {
    return this.shiftLeft(...this.shiftLeft(...this.shiftLeft(list)));
   }
  }

  shiftRight(nums: IGridCellState[], score: number = 0): [IGridCellState[], number] {
    let index = nums.length - 1;
    while (index) {
      if (nums[index].value === nums[index - 1].value || !nums[index].value) {
        if (nums[index - 1].value + nums[index].value && nums[index].value) {
          score = (nums[index - 1].value + nums[index].value);
        }
        nums[index].value += nums[index - 1].value;
        nums[index - 1].value = 0;
      }
      index -= 1;
    }
    return [nums, score];
  }

  shiftLeft(nums: IGridCellState[], score: number = 0): [IGridCellState[], number] {
    let index = 0;
    while (index < nums.length - 1) {
      if (nums[index].value === nums[index + 1].value || !nums[index].value) {
        if (nums[index + 1].value === nums[index].value && nums[index].value) {
          score = (nums[index + 1].value + nums[index].value);
        }
        nums[index].value += nums[index + 1].value;
        nums[index + 1].value = 0;
      }
      index += 1;
    }
    return [nums, score];
  }
}
