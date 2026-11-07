import { Injectable } from '@angular/core';
import { cloneDeep, sortBy } from 'lodash';
import { IGridCellState, ITileMove, ITileStage } from '../../components/grid-cell/grid-cell.type';
import { DEFAULT_GRID_SIZE, EDirection } from '../../interfaces/general.types';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  getRandomArrayEl<T>(array: Array<T>) {
    const randomNum = Math.floor(Math.random() * array.length);
    return array[randomNum];
  }

  splitArray(state: IGridCellState[], direction: EDirection, size: number = DEFAULT_GRID_SIZE): IGridCellState[][] {
    const result = Array.from({ length: size }, (): IGridCellState[] => []);

    state.forEach((cell) => {
      const index =
        direction === EDirection.right || direction === EDirection.left
          ? Math.floor((cell.key ?? 0) / size)
          : Math.floor((cell.key ?? 0) % size);
      result[index].push(cell);
    });

    return result;
  }

  // Each pass moves a tile one cell, so crossing the line takes one pass fewer than its length.
  shiftArray(list: IGridCellState[], direction: EDirection): [IGridCellState[], number] {
    let result: [IGridCellState[], number] = [list, 0];
    for (let pass = 1; pass < list.length; pass++) {
      result = this.shiftOnce(result[0], direction, result[1]);
    }
    return result;
  }

  private shiftOnce(list: IGridCellState[], direction: EDirection, score: number = 0): [IGridCellState[], number] {
    const forward = direction === EDirection.right || direction === EDirection.down;
    return forward ? this.shiftRight(list, score) : this.shiftLeft(list, score);
  }

  // Lines play side by side, each pausing only for its own merges, so a line with no merges slides in one go.
  traceStages(state: IGridCellState[], direction: EDirection, size: number = DEFAULT_GRID_SIZE): ITileStage[] {
    const lines = this.splitArray(state, direction, size).map(line => this.lineStages(line, direction));
    const count = Math.max(...lines.map(stages => stages.length)) - 1;
    return Array.from({ length: count }, (_, stage) => ({
      state: sortBy(lines.flatMap(stages => stages[Math.min(stage + 1, stages.length - 1)]), 'key'),
      moves: lines.flatMap(stages => stages[stage + 1] ? this.traceMoves(stages[stage], stages[stage + 1]) : []),
    }));
  }

  // The line as it starts and after each merge. Slides after the last merge have nothing to wait for, so they join it.
  private lineStages(line: IGridCellState[], direction: EDirection): IGridCellState[][] {
    const tileCount = (cells: IGridCellState[]) => cells.filter(cell => cell.value).length;
    const current = cloneDeep(line);
    const stages = [cloneDeep(line)];
    for (let pass = 1; pass < line.length; pass++) {
      const tiles = tileCount(current);
      this.shiftOnce(current, direction);
      if (tileCount(current) < tiles) { stages.push(cloneDeep(current)); }
    }
    stages[Math.max(stages.length - 1, 1)] = cloneDeep(current);
    return stages;
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