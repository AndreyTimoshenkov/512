import { Directive, Input, signal, WritableSignal } from '@angular/core';
import { EGridCellColor, TGridCellColor } from '../components/grid-cell/grid-cell.type';
import { colorMatcher } from '../components/grid-cell/grid-cell.helper';

@Directive({
  selector: '[bcgColour]',
  standalone: true,
  host: {
    '[style.background-color]': 'backgroundColour$$()',
  }
})
export class ColourDirective {
  backgroundColour$$: WritableSignal<TGridCellColor> = signal<TGridCellColor>(EGridCellColor.two);

  @Input() set bcg(value: number) {
    const colour = colorMatcher(value);
    this.backgroundColour$$.set(colour);
  }
}
