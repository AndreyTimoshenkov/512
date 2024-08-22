import { Component } from '@angular/core';
import { GridRowComponent } from '../grid-row/grid-row.component';
import { GridCellComponent } from '../grid-cell/grid-cell.component';

@Component({
  selector: 'grid-container',
  standalone: true,
  imports: [GridRowComponent, GridCellComponent],
  templateUrl: './grid-container.component.html',
  styleUrl: './grid-container.component.less'
})
export class GridContainerComponent {

}
