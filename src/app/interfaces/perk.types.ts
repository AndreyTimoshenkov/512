import { IGridCellState } from '../components/grid-cell/grid-cell.type';

// Ordered by importance, weakest first: the tray and the ladder rewards both follow this.
export enum EPerk {
  double = 'DOUBLE',
  swap = 'SWAP',
  hammer = 'HAMMER',
  undo = 'UNDO',
  shuffle = 'SHUFFLE',
  sweep = 'SWEEP',
  save = 'SAVE',
  upgrade = 'UPGRADE',
}

export const PERKS = Object.values(EPerk);
export const TILE_PERKS = [EPerk.hammer, EPerk.swap, EPerk.upgrade];
export const DOUBLE_MOVES = 5;

// Each tier is earned whole, the first time a game reaches its tile: an eighth, a quarter and half of the target.
export const PERK_TIERS = [
  { share: 8, perks: [EPerk.double, EPerk.swap, EPerk.hammer] },
  { share: 4, perks: [EPerk.undo, EPerk.shuffle, EPerk.sweep] },
  { share: 2, perks: [EPerk.save, EPerk.upgrade] },
];

export type TPerkInventory = Record<EPerk, number>;

export interface IPerkState {
  inventory: TPerkInventory;
  // The highest tile this game has reached, so a smashed tile can't earn its reward twice.
  highest: number;
  doubleMoves: number;
  // Where the next tile lands after an undo, so undoing can't reroll it.
  nextSpawn: number | null;
  undo: IUndoSnapshot | null;
  // The checkpoint made with the save perk; reloading it from the game-over panel uses it up.
  save: ISavedGame | null;
}

export interface ISavedGame {
  state: IGridCellState[];
  score: number;
  turn: number;
  perks: Omit<IPerkState, 'undo' | 'save'>;
}

export interface IUndoSnapshot {
  state: IGridCellState[];
  score: number;
  turn: number;
  perks: Omit<IPerkState, 'undo'>;
  spawn: number | null;
}

export interface IPerkHint {
  key: string;
  name?: string;
  moves?: number;
  tile?: number;
}
