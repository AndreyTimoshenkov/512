import { inject, Injectable } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';
import { WINDOW } from './injection-tokens';
import { ESupportedLocale } from '../../components/locale-switcher/locale.types';
import { DEFAULT_TARGET, GAME_TARGETS } from '../../interfaces/general.types';
import { IPerkState } from '../../interfaces/perk.types';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly _window = inject(WINDOW);
  // Belong to the player, not the game, so they outlive every save and new game.
  private readonly keptKeys = ['locale', 'introSeen'];

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

    const storage = this._window.localStorage;
    const kept = this.keptKeys.map(key => [key, storage?.getItem(key)] as const);
    storage?.clear();
    kept.forEach(([key, value]) => { if (value) { storage?.setItem(key, value); } });
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

  saveTarget(target: number) {
    this._window.localStorage?.setItem('target', JSON.stringify(target));
  }

  getTarget(): number {
    const target = this._window.localStorage?.getItem('target');
    const value = target ? JSON.parse(target) : DEFAULT_TARGET;

    return GAME_TARGETS.includes(value) ? value : DEFAULT_TARGET;
  }

  savePerks(perks: IPerkState) {
    this._window.localStorage?.setItem('perks', JSON.stringify(perks));
  }

  getPerks(): IPerkState | null {
    const perks = this._window.localStorage?.getItem('perks');

    return perks ? JSON.parse(perks) : null;
  }

  saveIntroSeen() {
    this._window.localStorage?.setItem('introSeen', 'true');
  }

  getIntroSeen(): boolean {
    return this._window.localStorage?.getItem('introSeen') === 'true';
  }

  saveLocale(locale: ESupportedLocale) {
    this._window.localStorage.setItem('locale', JSON.stringify(locale));
  }

  getLocale(): ESupportedLocale | null {
    const locale = (this._window.localStorage?.getItem('locale'));
    return locale ? JSON.parse(locale) : null;
  }
}
