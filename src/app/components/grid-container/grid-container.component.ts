import { Component } from '@angular/core';
import { GridRowComponent } from '../grid-row/grid-row.component';

@Component({
  selector: 'grid-container',
  standalone: true,
  imports: [GridRowComponent],
  templateUrl: './grid-container.component.html',
  styleUrl: './grid-container.component.less'
})
export class GridContainerComponent {

}
