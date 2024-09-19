export interface IGridCellState{
  value: number | null;
  key: number | null;
  new?: boolean | null;
}

export enum EGridCellColor {
  // support = '#587EDD',
  // error = '#E74326',
  // accent = '#97ba1e',
  // warning = '#F89E02',
  default = '#ffffff',
  grey = '#808080',
  new = '#97ba1e',
  regular = '#ffa500',
};

export type THexColor = `#${string}`;

export type TGridCellColor = keyof typeof EGridCellColor | THexColor;