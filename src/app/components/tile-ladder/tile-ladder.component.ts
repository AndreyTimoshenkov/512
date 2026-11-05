import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { colorMatcher } from '../grid-cell/grid-cell.helper';
import { DEFAULT_TARGET } from '../../interfaces/general.types';

@Component({
    selector: 'app-tile-ladder',
    templateUrl: './tile-ladder.component.html',
    styleUrl: './tile-ladder.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.--steps]': 'steps.length',
    }
})
export class TileLadderComponent {
  @Input() best = 0;
  @Input() rewards: number[] = [];

  steps: number[] = [];

  @Input() set target(target: number) {
    this.steps = Array.from({ length: Math.log2(target) }, (_, index) => 2 ** (index + 1));
  }

  constructor() {
    this.target = DEFAULT_TARGET;
  }

  colour = colorMatcher;
}
