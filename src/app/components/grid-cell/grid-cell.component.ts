import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, EventEmitter, HostBinding, HostListener, Input, OnChanges, Output, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { IGridCellState } from './grid-cell.type';

@Component({
  selector: 'grid-cell',
  standalone: true,
  imports: [ NgIf],
  templateUrl: './grid-cell.component.html',
  styleUrl: './grid-cell.component.less',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class.value':'hasValue'
  }
})
export class GridCellComponent implements OnChanges {
  _cellState: IGridCellState = {key: null, value: 0};
  //@ts-ignore
  cellState: WritableSignal<IGridCellState> = signal<IGridCellState>();

  constructor(){
    effect(() => {
      // console.log('cell effect', this.cellState());
      this.stateEmitter.emit(this.cellState())
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    //  console.log({...this._cellState})
    this.cellState.set({...this._cellState});
    // console.log(this._cellState.key, this._cellState.value)
  }

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

  @HostBinding('class.has-value') get hasValue() { return !!this.val; }
}
