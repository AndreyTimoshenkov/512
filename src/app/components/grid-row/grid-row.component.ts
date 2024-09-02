import { AfterContentInit, Component, ContentChildren, effect, HostListener, Injector, Input, OnChanges, QueryList, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';

@Component({
  selector: 'grid-row',
  standalone: true,
  imports: [GridCellComponent],
  templateUrl: './grid-row.component.html',
  styleUrl: './grid-row.component.less'
})
export class GridRowComponent implements AfterContentInit, OnChanges {
  _state = new Array;
  state: WritableSignal<Array<number>> = signal<Array<number>>(this._state);
  //@ts-ignore
  @Input() rowNumber: number;
  //@ts-ignore
  @ContentChildren(GridCellComponent, {static: true}) cellList: QueryList<GridCellComponent>;

  constructor(private injector: Injector) {}


  // private addKeys() {
  //   let row = this.rowNumber * this.cellList.toArray().length;
  //   this.cellList.forEach(cell => cell.key = row++)
  // }

  ngAfterContentInit(): void {
    // this.addKeys();
    // console.log('oninit row', this.rowNumber)
  }

  ngOnChanges(changes: SimpleChanges): void {
    // this.addKeys();
    // console.log('onchanges row', this.rowNumber)
  }
}
