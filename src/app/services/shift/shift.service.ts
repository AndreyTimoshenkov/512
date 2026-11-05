import { Injectable } from '@angular/core';
import { IGridCellState, ITileMove } from '../../components/grid-cell/grid-cell.type';
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

  // Tiles keep their order when sliding, so the old tiles fill the landed ones in turn until the values add up.
  traceMoves(before: IGridCellState[], after: IGridCellState[]): ITileMove[] {
    const tiles = before.filter(cell => cell.value);
    return after.flatMap(cell => {
      const moves: ITileMove[] = [];
      let sum = 0;
      while (cell.value && sum < cell.value && tiles.length) {
        const tile = tiles.shift()!;
        sum += tile.value;
        moves.push({ from: tile.key, to: cell.key, value: tile.value });
      }
      return moves;
    });
  }

  // Merging two 2^n tiles scores n: two 2s make 1 point, two 4s make 2, two 8s make 3.
  private mergePoints(tile: number): number {
    return Math.log2(tile);
  }

  shiftRight(nums: IGridCellState[], score: number = 0): [IGridCellState[], number] {
    let index = nums.length - 1;
    while (index) {
      if (nums[index].value === nums[index - 1].value || !nums[index].value) {
        if (nums[index - 1].value + nums[index].value && nums[index].value) {
          score += this.mergePoints(nums[index].value);
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
          score += this.mergePoints(nums[index].value);
        }
        nums[index].value += nums[index + 1].value;
        nums[index + 1].value = 0;
      }
      index += 1;
    }
    return [nums, score];
  }
}