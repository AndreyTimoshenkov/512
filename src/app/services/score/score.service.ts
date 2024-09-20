import { Injectable, signal, WritableSignal } from '@angular/core';
import { IGridCellState } from '../../components/grid-cell/grid-cell.type';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {

  score$$: WritableSignal<number> = signal(0);

  mergeCells(cell1: IGridCellState, cell2: IGridCellState) {
    if (Math.abs(cell1.key - cell2.key) !== 1) { return; }

    if (cell1.value !== cell2.value) { return; }

    const sum = cell1.value + cell2.value;

    this.score$$.update((score) => score += sum);
    // console.log(cell1.value, cell2.value, this.score$$());
  }

  resetScore() {
    this.score$$.set(0);
  }
}
