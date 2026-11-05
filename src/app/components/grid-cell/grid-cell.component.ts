
import { Component, HostBinding, Input, signal, WritableSignal, ChangeDetectionStrategy } from '@angular/core';
import { IGridCellState } from './grid-cell.type';
import { pipGrid } from './grid-cell.helper';
@Component({
    selector: 'grid-cell',
    imports: [],
    templateUrl: './grid-cell.component.html',
    styleUrl: './grid-cell.component.less',
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        '[style.--pips-x]': 'pips[0]',
        '[style.--pips-y]': 'pips[1]',
        '[attr.data-digits]': 'digits',
    }
})
export class GridCellComponent {
  _cellState: IGridCellState = {key: 0, value: 0};
  cellState: WritableSignal<IGridCellState> = signal<IGridCellState>(null);

  @Input() set value(value: number) {
    this._cellState.value = value;
  };

  get val() {
    return this._cellState.value;
  }

  get pips() {
    return pipGrid(this.val);
  }

  get digits() {
    return String(this.val).length;
  }

  @Input('cellKey') set key(value: number) {
    this._cellState.key = value;
  }

  @HostBinding('class.has-value') get hasValue() { return !!this.val; }
}
