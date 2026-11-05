import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EPerk, PERKS, TPerkInventory } from '../../interfaces/perk.types';
import { PERK_ART } from './perk-art';

@Component({
    selector: 'app-perk-tray',
    imports: [TranslateModule],
    templateUrl: './perk-tray.component.html',
    styleUrl: './perk-tray.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerkTrayComponent {
  @Input({ required: true }) inventory!: TPerkInventory;
  @Input() available = new Set<EPerk>();
  @Input() active: EPerk | null = null;
  @Input() doubling = false;
  @Input() saved = false;
  @Input() hint = '';
  @Output() use = new EventEmitter<EPerk>();

  perks = PERKS;
  double = EPerk.double;
  save = EPerk.save;
  art = PERK_ART;
}
