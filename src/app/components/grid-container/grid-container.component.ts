import { Component } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';

@Component({
  selector: 'grid-container',
  standalone: true,
  imports: [GridCellComponent],
  templateUrl: './grid-container.component.html',
  styleUrl: './grid-container.component.less'
})
export class GridContainerComponent {

}
