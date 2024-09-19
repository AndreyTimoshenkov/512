import { inject, Injectable } from '@angular/core';
import { IGridCellState } from '../components/grid-cell/grid-cell.type';
import { WINDOW } from './injection-tokens';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }
  private readonly _window = inject(WINDOW);

  saveState(state: Array<IGridCellState>) {
    if (!state.length) { return; }

    this._window.localStorage?.setItem('state', JSON.stringify(state));
  }

  getState(): Array<IGridCellState> {
    const state = this._window.localStorage?.getItem('state');

    return state ? JSON.parse(state) : [];
  }

  clear(): void {
    this._window.localStorage.clear();
  }
}
