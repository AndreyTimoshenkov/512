import { AfterContentInit, Component, ContentChildren, effect, HostListener, Input, QueryList, signal, WritableSignal } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';

@Component({
  selector: 'grid-row',
  standalone: true,
  imports: [GridCellComponent],
  templateUrl: './grid-row.component.html',
  styleUrl: './grid-row.component.less'
})
export class GridRowComponent implements AfterContentInit {
  //@ts-ignore
  @Input() rowNumber: number;
  //@ts-ignore
  @ContentChildren(GridCellComponent) cellList: QueryList<GridCellComponent>;

  constructor() {
    effect(() => {
      console.log('effect', this.state());
      if (!this.state().length) {return;}
      const cellList = this.cellList.toArray();
      for(let i = 0; i < cellList.length; i++) {
        cellList[i].value = this.state()[i];
      }
    });
  }
  @HostListener('window:keydown.ArrowLeft', ['$event'])
  left(event: KeyboardEvent) {
    console.log(event.key)
    this.state.update((state) => this.shiftArrayLeft(state));
  }

  @HostListener('window:keydown.ArrowRight', ['$event'])
  right(event: KeyboardEvent) {
    console.log(event.key)
    this.state.update((state) => this.shiftArrayRight(state));
  }

  @HostListener('window:keydown.ArrowDown', ['$event'])
  down(event: KeyboardEvent) {
    console.log(event.key)
  }

  @HostListener('window:keydown.ArrowUp', ['$event'])
  up(event: KeyboardEvent) {
    console.log(event.key)
  }

  _state = new Array;
  state: WritableSignal<Array<number>> = signal<Array<number>>(this._state);

  private addKeys() {
    let row = this.rowNumber * this.cellList.toArray().length;
    this.cellList.forEach(cell => cell.key = row++)
  }
  ngAfterContentInit(): void {
    this.addKeys();
    this._state = Array.from(this.cellList.toArray());
  }

  private shiftArrayRight(list: Array<number>): Array<number> {
    for (let i = 0; i < list.length - 1; i++) {
      if ((list[i] && !list[i + 1]) || list[i] === list[i + 1]) {
        list[i + 1] += list[i];
        list[i] = 0;
      }
    }
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i] && !list[i + 1]) {
        list[i + 1] += list[i];
        list[i] = 0;
      }
    }
    console.log('shiftArrayRight', list);
    return list;
  }

  private shiftArrayLeft(list: Array<number>): Array<number> {
    console.log('shiftArrayLeft');
    return this.shiftArrayRight(list).reverse();
  }

}
