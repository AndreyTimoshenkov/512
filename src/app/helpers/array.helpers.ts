import { IGridCellState } from "../components/grid-cell/grid-cell.type";
import { EDirection } from "../interfaces/general.types";

export function getRandomArrayEl<T>(array: Array<T>) {
  const randomNum = Math.floor(Math.random() * array.length);
  return array[randomNum];
}

export function splitArray(state: IGridCellState[], direction: EDirection): IGridCellState[][] {
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

export function shiftArray(list: IGridCellState[], direction: EDirection): IGridCellState[] {
  // console.log(...list, direction);
  const length = list.length;

  if (direction === EDirection.right || direction === EDirection.down) {
    for (let i = 0; i < length - 1; i++) {
      if (
        (list[i].value && !list[i + 1].value) ||
        list[i].value === list[i + 1].value
      ) {
        list[i + 1].value! += list[i].value!;
        list[i].value = 0;
      }
    }
    for (let i = 0; i < length - 1; i++) {
      if (list[i].value && !list[i + 1].value) {
        list[i + 1].value! += list[i].value!;
        list[i].value = 0;
      }
    }
    for (let i = 0; i < length - 1; i++) {
      if (list[i].value && !list[i + 1].value) {
        list[i + 1].value! += list[i].value!;
        list[i].value = 0;
      }
    }
  } else if (direction === EDirection.up || direction === EDirection.left) {
    for (let i = length - 1; i > 0; i--) {
      if ((list[i].value && !list[i - 1].value) || list[i].value === list[i - 1].value) {
        list[i - 1].value! += list[i].value!;
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
    return list;
  }
  return list;
}