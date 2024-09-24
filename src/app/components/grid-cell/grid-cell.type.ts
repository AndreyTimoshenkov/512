export interface IGridCellState{
  value: number;
  key: number;
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
  grey = '#808080',
  two = '#6A8A13',
  four = '#97BA1E',
  eight = '#B4DA2E',
  sixteen = '#DBF244',
  thirtytwo = '#FFD700',
  sixtyfour = '#FFB347',
  onetwentyeight = '#FF8C42',
  twofiftysix = '#FF6347',
  fivetwelve = '#FF4500',
  onektwentyfour = '#FF2400'
}

export type THexColor = `#${string}`;

export type TGridCellColor = keyof typeof EGridCellColor | THexColor;