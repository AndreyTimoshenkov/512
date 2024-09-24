import { NgIf } from '@angular/common';
import { Component, HostBinding, Input, signal, WritableSignal } from '@angular/core';
import { EGridCellColor, IGridCellState, TGridCellColor } from './grid-cell.type';
@Component({
  selector: 'grid-cell',
  standalone: true,
  imports: [ NgIf],
  templateUrl: './grid-cell.component.html',
  styleUrl: './grid-cell.component.less',
  host: {
    '[style.--cell-color]': 'cellColor$$()',
  }
})
export class GridCellComponent {
  _cellState: IGridCellState = {key: 0, value: 0};
  //@ts-ignore
  cellState: WritableSignal<IGridCellState> = signal<IGridCellState>(null);
  cellColor$$: WritableSignal<TGridCellColor> = signal<TGridCellColor>(EGridCellColor.grey);

  @Input() set value(value: number) {
    this._cellState.value = value;
  };

  get val() {
    return this._cellState.value;
  }

  @Input('cellKey') set key(value: number) {
    this._cellState.key = value;
  }

  @HostBinding('class.has-value') get hasValue() { return !!this.val; }
}
