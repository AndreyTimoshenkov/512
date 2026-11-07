import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EPerk, TPerkEffect } from '../../interfaces/perk.types';
import { PerkIconComponent } from '../perk-icon/perk-icon.component';

// Plays once over the board, sized to the grid. Everything rests hidden, so reduced motion simply skips it.
@Component({
    selector: 'app-perk-effect',
    imports: [PerkIconComponent],
    templateUrl: './perk-effect.component.html',
    styleUrl: './perk-effect.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'aria-hidden': 'true',
        '[attr.data-fx]': 'effect()',
        '[style.--x]': 'position()[0]',
        '[style.--y]': 'position()[1]',
    }
})
export class PerkEffectComponent {
  effect = input.required<TPerkEffect>();
  // The cell it happens on; without one it plays at the centre of the board.
  cell = input<number | undefined>();
  size = input.required<number>();

  icon = computed(() => this.effect() === 'LOAD' ? EPerk.save : this.effect() as EPerk);
  position = computed(() => {
    const cell = this.cell();
    const size = this.size();
    if (cell === undefined) { return ['50%', '50%']; }
    const percent = (line: number) => `${(line + 0.5) / size * 100}%`;
    return [percent(cell % size), percent(Math.floor(cell / size))];
  });
}
