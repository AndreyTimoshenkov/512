import { inject, Injectable } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { WINDOW } from './injection-tokens';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly _window = inject(WINDOW);

  saveState(state: Array<IGridCellState>) {
    if (!state.length) { return; }

    this.clear();

    this._window.localStorage?.setItem('state', JSON.stringify(state));
  }

  getState(): Array<IGridCellState> {
    const state = this._window.localStorage?.getItem('state');

    return state ? JSON.parse(state) : [];
  }

  clear(): void {
    if (!this.getState()) { return; }
    this._window.localStorage?.clear();
  }

  saveTurn(turn: number) {
    this._window.localStorage?.setItem('turn', JSON.stringify(turn));
  }

  getTurn(): number {
    const turn = this._window.localStorage?.getItem('turn');

    return turn ? JSON.parse(turn) : 1;
  }

  saveScore(score: number) {
    this._window.localStorage?.setItem('score', JSON.stringify(score));
  }

  getScore() {
    const score = this._window.localStorage?.getItem('score');

    return score ? JSON.parse(score) : 0;
  }
}
