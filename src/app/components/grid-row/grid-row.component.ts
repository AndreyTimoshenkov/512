import { AfterContentInit, Component, ContentChildren, HostListener, Input, QueryList } from '@angular/core';
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
  @HostListener('window:keydown.ArrowLeft', ['$event'])
  left(event: KeyboardEvent) {
    console.log(event.key)
    for (let i = this.state.length - 1; i > 0; i--) {
      if (this.state[i].value === this.state[i - 1].value) {
        this.state[i - 1].value += this.state[i].value;
        this.state[i].value = 0;
      }
    }
  }

  @HostListener('window:keydown.ArrowRight', ['$event'])
  right(event: KeyboardEvent) {
    console.log(event.key)
    for (let i = 0; i < this.state.length - 1; i++) {
      if (this.state[i].value === this.state[i + 1].value) {
        this.state[i + 1].value += this.state[i].value;
        this.state[i].value = 0;
      }
    }
  }

  @HostListener('window:keydown.ArrowDown', ['$event'])
  down(event: KeyboardEvent) {
    console.log(event.key)
  }

  @HostListener('window:keydown.ArrowUp', ['$event'])
  up(event: KeyboardEvent) {
    console.log(event.key)
  }

  state = new Array;

  private addKeys() {
    let row = this.rowNumber * this.cellList.toArray().length;
    this.cellList.forEach(cell => cell.key = row++)
  }
  ngAfterContentInit(): void {
    this.addKeys();
    // this.cellList.forEach(cell => console.log('row', this.rowNumber, 'key', cell.key));
    this.state = Array.from(this.cellList.toArray());

  }

}
