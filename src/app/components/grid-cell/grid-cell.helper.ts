import { EGridCellColor } from "./grid-cell.type";

export function colorMatcher(value: number): EGridCellColor {
  switch(value) {
    case 0:
      return EGridCellColor.grey;
    case 2:
      return EGridCellColor.two;
    case 4:
      return EGridCellColor.four;
    case 8:
      return EGridCellColor.eight;
    case 16:
      return EGridCellColor.sixteen;
    case 32:
      return EGridCellColor.thirtytwo;
    case 64:
      return EGridCellColor.sixtyfour;
    case 128:
      return EGridCellColor.onetwentyeight;
    case 256:
      return EGridCellColor.twofiftysix;
    case 512:
      return EGridCellColor.fivetwelve;
    case 1024:
      return EGridCellColor.onektwentyfour;
    case 2048:
      return EGridCellColor.twentyfortyeight;
    default:
      return EGridCellColor.fourtyninetysix
  }
}

// A tile holds as many pips as its value: every doubling splits the pips along the shorter side.
export function pipGrid(value: number): [number, number] {
  const power = Math.log2(value || 1);
  return [2 ** Math.ceil(power / 2), 2 ** Math.floor(power / 2)];
}
