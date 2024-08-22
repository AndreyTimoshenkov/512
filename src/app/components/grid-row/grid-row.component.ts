import { Component } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';

@Component({
  selector: 'grid-row',
  standalone: true,
  imports: [GridCellComponent],
  templateUrl: './grid-row.component.html',
  styleUrl: './grid-row.component.less'
})
export class GridRowComponent {

}
