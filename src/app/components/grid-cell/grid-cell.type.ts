export interface IGridCellState{
  value: number;
  key: number;
}

export interface ITileMove {
  from: number;
  to: number;
  value: number;
}

// One beat of a move: the board once it has played, and the tiles that travel to get there.
export interface ITileStage {
  state: IGridCellState[];
  moves: ITileMove[];
}

export interface ITileSlide {
  value: number;
  row: number;
  column: number;
  rows: number;
  columns: number;
}

// export enum EGridCellColor {
//   // support = '#587EDD',
//   // error = '#E74326',
//   // accent = '#97ba1e',
//   // warning = '#F89E02',
//   default = '#ffffff',
//   grey = '#808080',
//   new = '#97ba1e',
//   regular = '#ffa500',
// };

export enum EGridCellColor {
  grey = '#2224ad',
  two = '#d3f3ea',
  four = '#a5eec6',
  eight = '#d4f26b',
  sixteen = '#fbe84b',
  thirtytwo = '#ffca3a',
  sixtyfour = '#ffa238',
  onetwentyeight = '#ff7d45',
  twofiftysix = '#ff5660',
  fivetwelve = '#ff3d9a',
  onektwentyfour = '#d65cf2',
  twentyfortyeight = '#a066ff',
  fourtyninetysix = '#7f78ff'
}

export type THexColor = `#${string}`;

export type TGridCellColor = keyof typeof EGridCellColor | THexColor;