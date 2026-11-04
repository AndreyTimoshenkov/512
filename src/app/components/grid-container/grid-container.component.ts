import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GridCellComponent } from '../grid-cell/grid-cell.component';

@Component({
    selector: 'grid-container',
    templateUrl: './grid-container.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './grid-container.component.less'
})
export class GridContainerComponent {

}
