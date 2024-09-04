import { AfterContentInit, Component, ContentChildren, Injector, Input, OnChanges, QueryList, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';
import { IGridCellState } from '../grid-cell/grid-cell.type';

@Component({
  selector: 'grid-row',
  standalone: true,
  imports: [GridCellComponent],
  templateUrl: './grid-row.component.html',
  styleUrl: './grid-row.component.less'
})
export class GridRowComponent implements AfterContentInit, OnChanges {
  _state = new Array<IGridCellState>;
  state: WritableSignal<Array<IGridCellState>> = signal<Array<IGridCellState>>(this._state);
  @Input() rowNumber: number = 0;
  //@ts-ignore
  @ContentChildren(GridCellComponent, {static: true}) cellList: QueryList<GridCellComponent>;

  constructor(private injector: Injector) {}

  ngAfterContentInit(): void {
    const list = [];
    this.cellList.forEach(cell => {
      list.push(cell);
    })
    // this.state.set();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // this.addKeys();
    // console.log('onchanges row', this.rowNumber)
  }
}
