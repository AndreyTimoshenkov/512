import { inject, Injectable } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { WINDOW } from './injection-tokens';
import { ESupportedLocale } from '../../components/locale-switcher/locale.types';

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

    const locale = this.getLocale();
    this._window.localStorage?.clear();
    if (locale) {this.saveLocale(locale)};
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

  saveLocale(locale: ESupportedLocale) {
    this._window.localStorage.setItem('locale', JSON.stringify(locale));
  }

  getLocale(): ESupportedLocale | null {
    const locale = (this._window.localStorage?.getItem('locale'));
    return locale ? JSON.parse(locale) : null;
  }
}
