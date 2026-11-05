import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { colorMatcher } from '../grid-cell/grid-cell.helper';

@Component({
    selector: 'app-tile-ladder',
    templateUrl: './tile-ladder.component.html',
    styleUrl: './tile-ladder.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileLadderComponent {
  @Input() best = 0;

  steps = [2, 4, 8, 16, 32, 64, 128, 256, 512];
  colour = colorMatcher;
}
