import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EPerk } from '../../interfaces/perk.types';
import { PERK_ART } from '../perk-tray/perk-art';

@Component({
    selector: 'app-perk-icon',
    templateUrl: './perk-icon.component.html',
    styleUrl: './perk-icon.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerkIconComponent {
  perk = input.required<EPerk>();
  layers = computed(() => PERK_ART[this.perk()]);
}
