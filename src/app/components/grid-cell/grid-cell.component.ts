import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, EventEmitter, HostBinding, HostListener, Input, OnChanges, Output, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { EGridCellColor, IGridCellState, TGridCellColor, THexColor } from './grid-cell.type';

@Component({
  selector: 'grid-cell',
  standalone: true,
  imports: [ NgIf],
  templateUrl: './grid-cell.component.html',
  styleUrl: './grid-cell.component.less',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--cell-bcg]': 'bcg$$()',
    '[style.--cell-color]': 'cellColor$$()',
  }
})
export class GridCellComponent implements OnChanges {
  _cellState: IGridCellState = {key: null, value: 0};
  //@ts-ignore
  cellState: WritableSignal<IGridCellState> = signal<IGridCellState>(null);
  bcg$$: WritableSignal<TGridCellColor> = signal<TGridCellColor>(EGridCellColor.regular);
  cellColor$$: WritableSignal<TGridCellColor> = signal<TGridCellColor>(EGridCellColor.grey);


  constructor(){
    effect(() => {
      this.stateEmitter.emit(this.cellState())
    });
  }
  ngOnChanges(changes: SimpleChanges): void {}

  @Output('gridCellEmitter') stateEmitter: EventEmitter<IGridCellState> = new EventEmitter<IGridCellState>();

  @Input() set value(value: number) {
    this._cellState.value = value;
  };

  get val() {
    return this._cellState.value;
  }

  @Input('cellKey') set key(value: number) {
    this._cellState.key = value;
  }

  @Input('cellNew') set _isNew(value: boolean) {
    this._cellState.new = value;
    const bcg: THexColor = value ? '#97ba1e' : '#808080';;
    this.bcg$$.set(bcg);
    const color: THexColor = value ? /*'#ffa500'*/ '#ffffff' : '#ffffff';
    this.cellColor$$.set(color);
  }

  @HostBinding('class.has-value') get hasValue() { return !!this.val; }
}
