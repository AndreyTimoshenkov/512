import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { pipGrid } from './grid-cell.helper';
@Component({
    selector: 'grid-cell',
    imports: [],
    templateUrl: './grid-cell.component.html',
    styleUrl: './grid-cell.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.has-value]': 'hasValue()',
        '[style.--pips-x]': 'pips()[0]',
        '[style.--pips-y]': 'pips()[1]',
        '[attr.data-digits]': 'digits()',
    }
})
export class GridCellComponent {
  value = input(0);
  hasValue = computed(() => !!this.value());
  pips = computed(() => pipGrid(this.value()));
  digits = computed(() => String(this.value()).length);
}
